// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "../src/desktopactionlogic.h"

#include <KJob>

#include <QAction>
#include <QTest>
#include <QVariantMap>

class FakeLaunchJob final : public KJob {
  Q_OBJECT

public:
  explicit FakeLaunchJob(int errorCode, const QString &errorText,
                         int *startCounter, QObject *parent = nullptr)
      : KJob(parent), m_errorCode(errorCode), m_errorText(errorText),
        m_startCounter(startCounter) {}

  void start() override {
    if (m_startCounter) {
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

class DesktopActionLogicTest final : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void filtersHiddenServiceActions();
  void addsLauncherContextToDescriptors();
  void emitsLaunchFailureResultFromFakeJob();
};

void DesktopActionLogicTest::filtersHiddenServiceActions() {
  QList<DesktopActionSource> sources{
      {
          .text = QStringLiteral("Visible Action"),
          .iconName = QStringLiteral("visible-icon"),
      },
      {
          .text = QStringLiteral("Hidden Action"),
          .iconName = QStringLiteral("hidden-icon"),
          .noDisplay = true,
      },
      {
          .separator = true,
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
      .launcherUrl = QStringLiteral("applications:broken.desktop"),
      .desktopEntryPath =
          QStringLiteral("/usr/share/applications/broken.desktop"),
  };
  int startCount = 0;
  QList<QVariantMap> results;

  QAction *action = desktopActionFromDescriptor(
      descriptor, this,
      [&](const DesktopActionDescriptor &) {
        return new FakeLaunchJob(7, QStringLiteral("launch failed"),
                                 &startCount);
      },
      [&](const QVariantMap &result) { results << result; });
  QVERIFY(action);

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

QTEST_MAIN(DesktopActionLogicTest)

#include "desktopactionlogic_test.moc"
