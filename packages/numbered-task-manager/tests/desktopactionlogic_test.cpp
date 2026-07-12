// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "../src/desktopactionjobowner.h"
#include "../src/desktopactionlogic.h"

#include <KJob>

#include <QAction>
#include <QPointer>
#include <QTest>
#include <QVariantMap>

#include <utility>

class FakeLaunchJob final : public KJob {
  Q_OBJECT

public:
  explicit FakeLaunchJob(int errorCode, QString errorText, int *startCounter,
                         QObject *parent = nullptr)
      : KJob(parent), m_errorCode(errorCode), m_errorText(std::move(errorText)),
        m_startCounter(startCounter) {}

  void start() override {
    if (m_startCounter != nullptr) {
      ++(*m_startCounter);
    }
    if (m_errorCode != 0) {
      setError(m_errorCode);
      setErrorText(m_errorText);
    }
    emitResult();
  }

private:
  int m_errorCode = 0;
  QString m_errorText;
  int *m_startCounter = nullptr;
};

class DelayedLaunchJob final : public KJob {
  Q_OBJECT

public:
  explicit DelayedLaunchJob(int *startCounter, int *killCounter = nullptr,
                            bool killable = false, QObject *parent = nullptr)
      : KJob(parent), m_startCounter(startCounter), m_killCounter(killCounter) {
    if (killable) {
      setCapabilities(KJob::Killable);
    }
  }

  void start() override {
    if (m_startCounter != nullptr) {
      ++(*m_startCounter);
    }
  }

  void completeWithError(int errorCode, const QString &errorText) {
    setError(errorCode);
    setErrorText(errorText);
    emitResult();
  }

protected:
  bool doKill() override {
    if (m_killCounter != nullptr) {
      ++(*m_killCounter);
    }
    return true;
  }

private:
  int *m_startCounter = nullptr;
  int *m_killCounter = nullptr;
};

class DesktopActionLogicTest final : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void filtersHiddenServiceActions();
  void addsLauncherContextToDescriptors();
  void emitsLaunchFailureResultFromFakeJob();
  void observesDelayedFailureAfterActionOwnerIsDestroyed();
  void quietlyCancelsKillableJobsWhenOwnerIsDestroyed();
  void releasesNonKillableJobsWhenOwnerIsDestroyed();
};

void DesktopActionLogicTest::filtersHiddenServiceActions() {
  QList<DesktopActionSource> sources{
      {
          .text = QStringLiteral("Visible Action"),
          .iconName = QStringLiteral("visible-icon"),
          .noDisplay = false,
          .separator = false,
          .serviceAction = {},
      },
      {
          .text = QStringLiteral("Hidden Action"),
          .iconName = QStringLiteral("hidden-icon"),
          .noDisplay = true,
          .separator = false,
          .serviceAction = {},
      },
      {
          .text = {},
          .iconName = {},
          .noDisplay = false,
          .separator = true,
          .serviceAction = {},
      },
  };

  const QList<DesktopActionDescriptor> descriptors =
      desktopActionDescriptors(sources);

  QCOMPARE(descriptors.size(), 2);
  QCOMPARE(descriptors.at(0).text, QStringLiteral("Visible Action"));
  QCOMPARE(descriptors.at(0).iconName, QStringLiteral("visible-icon"));
  QVERIFY(!descriptors.at(0).separator);
  QVERIFY(descriptors.at(1).separator);
}

void DesktopActionLogicTest::addsLauncherContextToDescriptors() {
  const QList<DesktopActionDescriptor> descriptors{
      {
          .text = QStringLiteral("Open Private Window"),
          .iconName = QStringLiteral("window-new"),
          .launcherUrl = {},
          .desktopEntryPath = {},
          .separator = false,
          .serviceAction = {},
      },
  };

  const QList<DesktopActionDescriptor> contextualDescriptors =
      descriptorsWithContext(
          descriptors, QUrl(QStringLiteral("applications:browser.desktop")),
          QStringLiteral("/usr/share/applications/browser.desktop"));

  QCOMPARE(contextualDescriptors.size(), 1);
  QCOMPARE(contextualDescriptors.at(0).launcherUrl,
           QStringLiteral("applications:browser.desktop"));
  QCOMPARE(contextualDescriptors.at(0).desktopEntryPath,
           QStringLiteral("/usr/share/applications/browser.desktop"));
}

void DesktopActionLogicTest::emitsLaunchFailureResultFromFakeJob() {
  const DesktopActionDescriptor descriptor{
      .text = QStringLiteral("Broken Action"),
      .iconName = {},
      .launcherUrl = QStringLiteral("applications:broken.desktop"),
      .desktopEntryPath =
          QStringLiteral("/usr/share/applications/broken.desktop"),
      .separator = false,
      .serviceAction = {},
  };
  int startCount = 0;
  QList<QVariantMap> results;

  DesktopActionJobOwner jobOwner(
      [&](const DesktopActionDescriptor &) {
        return new FakeLaunchJob(7, QStringLiteral("launch failed"),
                                 &startCount);
      },
      [&](const QVariantMap &result) { results << result; });
  QAction *action = desktopActionFromDescriptor(
      descriptor, this, &jobOwner,
      [&](const DesktopActionDescriptor &actionDescriptor) {
        jobOwner.launch(actionDescriptor);
      });
  QVERIFY(action != nullptr);

  action->trigger();

  QCOMPARE(startCount, 1);
  QCOMPARE(results.size(), 1);
  const QVariantMap result = results.takeFirst();
  QCOMPARE(result.value(QStringLiteral("action")).toString(),
           QStringLiteral("desktopAction"));
  QCOMPARE(result.value(QStringLiteral("code")).toString(),
           QStringLiteral("desktop-action-launch-failed"));
  QCOMPARE(result.value(QStringLiteral("ok")).toBool(), false);
  QCOMPARE(result.value(QStringLiteral("diagnostic")).toBool(), true);
  const QVariantMap context = result.value(QStringLiteral("context")).toMap();
  QCOMPARE(context.value(QStringLiteral("launcherUrl")).toString(),
           QStringLiteral("applications:broken.desktop"));
  QCOMPARE(context.value(QStringLiteral("desktopEntryPath")).toString(),
           QStringLiteral("/usr/share/applications/broken.desktop"));
  QCOMPARE(context.value(QStringLiteral("desktopActionText")).toString(),
           QStringLiteral("Broken Action"));
  QCOMPARE(context.value(QStringLiteral("errorCode")).toInt(), 7);
  QCOMPARE(context.value(QStringLiteral("errorMessage")).toString(),
           QStringLiteral("launch failed"));
}

void DesktopActionLogicTest::
    observesDelayedFailureAfterActionOwnerIsDestroyed() {
  const DesktopActionDescriptor descriptor{
      .text = QStringLiteral("Delayed Broken Action"),
      .iconName = {},
      .launcherUrl = QStringLiteral("applications:delayed.desktop"),
      .desktopEntryPath =
          QStringLiteral("/usr/share/applications/delayed.desktop"),
      .separator = false,
      .serviceAction = {},
  };
  int startCount = 0;
  QList<QVariantMap> results;
  QPointer<DelayedLaunchJob> job;
  DesktopActionJobOwner jobOwner(
      [&](const DesktopActionDescriptor &) -> KJob * {
        job = new DelayedLaunchJob(&startCount);
        return job;
      },
      [&](const QVariantMap &result) { results << result; });
  auto *actionOwner = new QObject;
  QPointer<QAction> action = desktopActionFromDescriptor(
      descriptor, actionOwner, &jobOwner,
      [&](const DesktopActionDescriptor &actionDescriptor) {
        jobOwner.launch(actionDescriptor);
      });

  QVERIFY(action != nullptr);
  action->trigger();
  QCOMPARE(startCount, 1);
  QCOMPARE(jobOwner.activeJobCount(), 1);

  delete actionOwner;
  QVERIFY(action.isNull());
  QVERIFY(job != nullptr);
  job->completeWithError(9, QStringLiteral("delayed launch failed"));

  QCOMPARE(results.size(), 1);
  QCOMPARE(results.constFirst().value(QStringLiteral("code")).toString(),
           QStringLiteral("desktop-action-launch-failed"));
  QCOMPARE(jobOwner.activeJobCount(), 0);
  QTRY_VERIFY(job.isNull());
}

void DesktopActionLogicTest::quietlyCancelsKillableJobsWhenOwnerIsDestroyed() {
  int startCount = 0;
  int killCount = 0;
  QList<QVariantMap> results;
  QPointer<DelayedLaunchJob> job;
  auto *jobOwner = new DesktopActionJobOwner(
      [&](const DesktopActionDescriptor &) -> KJob * {
        job = new DelayedLaunchJob(&startCount, &killCount, true);
        return job;
      },
      [&](const QVariantMap &result) { results << result; });

  jobOwner->launch(DesktopActionDescriptor{});
  QCOMPARE(jobOwner->activeJobCount(), 1);
  delete jobOwner;

  QCOMPARE(startCount, 1);
  QCOMPARE(killCount, 1);
  QCOMPARE(results.size(), 0);
  QTRY_VERIFY(job.isNull());
}

void DesktopActionLogicTest::releasesNonKillableJobsWhenOwnerIsDestroyed() {
  int startCount = 0;
  QList<QVariantMap> results;
  QPointer<DelayedLaunchJob> job;
  auto *jobOwner = new DesktopActionJobOwner(
      [&](const DesktopActionDescriptor &) -> KJob * {
        job = new DelayedLaunchJob(&startCount);
        return job;
      },
      [&](const QVariantMap &result) { results << result; });

  jobOwner->launch(DesktopActionDescriptor{});
  delete jobOwner;

  QVERIFY(job != nullptr);
  job->completeWithError(11, QStringLiteral("unobserved after shutdown"));
  QCOMPARE(results.size(), 0);
  QTRY_VERIFY(job.isNull());
}

QTEST_MAIN(DesktopActionLogicTest)

#include "desktopactionlogic_test.moc"
