// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopid.h"
#include "tabpagerlogging.h"
#include "taskmanagerdesktopmapper.h"
#include "taskmanagerdesktopsource.h"

#include <QSignalSpy>
#include <QTest>

#include <memory>
#include <utility>

namespace {
class CapturedTabPagerWarnings {
public:
  CapturedTabPagerWarnings()
      : m_previousHandler(qInstallMessageHandler(capture)) {
    s_previousHandler = m_previousHandler;
    s_warningCount = 0;
  }

  ~CapturedTabPagerWarnings() {
    qInstallMessageHandler(m_previousHandler);
    s_previousHandler = nullptr;
  }

  [[nodiscard]] int warningCount() const { return s_warningCount; }

private:
  static void capture(QtMsgType type, const QMessageLogContext &context,
                      const QString &message) {
    if (type == QtWarningMsg &&
        QString::fromUtf8(context.category) ==
            QString::fromUtf8(tabPagerLog().categoryName())) {
      ++s_warningCount;
      return;
    }

    if (s_previousHandler != nullptr) {
      s_previousHandler(type, context, message);
    }
  }

  QtMessageHandler m_previousHandler = nullptr;
  inline static QtMessageHandler s_previousHandler = nullptr;
  inline static int s_warningCount = 0;
};

class FakeVirtualDesktopInfo final : public TabPagerVirtualDesktopInfo {
public:
  explicit FakeVirtualDesktopInfo(QVariantList desktopIds = {},
                                  QStringList desktopNames = {},
                                  QVariant currentDesktop = {},
                                  bool navigationWrappingAround = false)
      : m_desktopIds(std::move(desktopIds)),
        m_desktopNames(std::move(desktopNames)),
        m_currentDesktop(std::move(currentDesktop)),
        m_navigationWrappingAround(navigationWrappingAround) {}

  [[nodiscard]] QVariantList desktopIds() const override {
    return m_desktopIds;
  }

  [[nodiscard]] QStringList desktopNames() const override {
    return m_desktopNames;
  }

  [[nodiscard]] QVariant currentDesktop() const override {
    return m_currentDesktop;
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void requestActivate(const QVariant &desktopId) override {
    m_requestedActivations.append(desktopId);
  }

  void setDesktopIds(QVariantList desktopIds) {
    m_desktopIds = std::move(desktopIds);
    Q_EMIT desktopIdsChanged();
  }

  void setDesktopNames(QStringList desktopNames) {
    m_desktopNames = std::move(desktopNames);
    Q_EMIT desktopNamesChanged();
  }

  void setDesktopState(QVariantList desktopIds, QStringList desktopNames,
                       QVariant currentDesktop = {}) {
    m_desktopIds = std::move(desktopIds);
    m_desktopNames = std::move(desktopNames);
    m_currentDesktop = std::move(currentDesktop);
    Q_EMIT desktopIdsChanged();
  }

  void emitNumberOfDesktopsChanged() { Q_EMIT numberOfDesktopsChanged(); }

  void setCurrentDesktop(QVariant currentDesktop) {
    m_currentDesktop = std::move(currentDesktop);
    Q_EMIT currentDesktopChanged();
  }

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

  [[nodiscard]] QVariantList requestedActivations() const {
    return m_requestedActivations;
  }

private:
  QVariantList m_desktopIds;
  QStringList m_desktopNames;
  QVariant m_currentDesktop;
  bool m_navigationWrappingAround = false;
  QVariantList m_requestedActivations;
};

struct SourceFixture {
private:
  struct AdoptInfo {};

public:
  explicit SourceFixture(QVariantList desktopIds = {},
                         QStringList desktopNames = {},
                         QVariant currentDesktop = {},
                         bool navigationWrappingAround = false)
      : SourceFixture(AdoptInfo{},
                      std::make_unique<FakeVirtualDesktopInfo>(
                          std::move(desktopIds), std::move(desktopNames),
                          std::move(currentDesktop),
                          navigationWrappingAround)) {}

  FakeVirtualDesktopInfo *info = nullptr;
  TaskManagerDesktopSource source;

private:
  explicit SourceFixture([[maybe_unused]] AdoptInfo adoptInfo,
                         std::unique_ptr<FakeVirtualDesktopInfo> fakeInfo)
      : info(fakeInfo.get()), source(std::move(fakeInfo)) {}
};

struct SettingsFixture {
private:
  struct AdoptInfo {};

public:
  explicit SettingsFixture(bool navigationWrappingAround = false)
      : SettingsFixture(AdoptInfo{},
                        std::make_unique<FakeVirtualDesktopInfo>(
                            QVariantList{}, QStringList{}, QVariant{},
                            navigationWrappingAround)) {}

  FakeVirtualDesktopInfo *info = nullptr;
  TaskManagerNavigationSettingsSource source;

private:
  explicit SettingsFixture([[maybe_unused]] AdoptInfo adoptInfo,
                           std::unique_ptr<FakeVirtualDesktopInfo> fakeInfo)
      : info(fakeInfo.get()), source(std::move(fakeInfo)) {}
};

[[nodiscard]] TabPagerDesktopSourceState
sourceStateFromRawState(QVariantList desktopIds, QStringList desktopNames = {},
                        QVariant currentDesktop = {}) {
  return taskManagerDesktopSourceStateFromRawState(TaskManagerDesktopRawState{
      .desktopIds = std::move(desktopIds),
      .desktopNames = std::move(desktopNames),
      .currentDesktop = std::move(currentDesktop),
  });
}
} // namespace

class TaskManagerDesktopSourceTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void projectsVirtualDesktopInfoToSourceState();
  void projectsMissingDesktopNamesAsEmptyNames();
  void ignoresExtraDesktopNames();
  void dropsInvalidDesktopIds();
  void dropsDuplicateDesktopIds();
  void clearsUnmatchedCurrentDesktop();
  void reportsNameCountDiagnostics();
  void reportsDesktopIdentityDiagnostics();
  void exposesCurrentSourceDiagnostics();
  void doesNotLogSourceDiagnosticsOnStateReads();
  void logsSourceDiagnosticsWhenDiagnosticStateChanges();
  void emitsSourceStateChangedWhenVirtualDesktopInfoChanges();
  void exposesNavigationWrappingThroughSettingsSource();
  void requestsActivationForValidDesktopIdsOnly();
};

void TaskManagerDesktopSourceTest::projectsVirtualDesktopInfoToSourceState() {
  SourceFixture fixture({QStringLiteral("a"), QStringLiteral("b")},
                        {QStringLiteral("Desktop 1"), QStringLiteral("Work")},
                        QStringLiteral("b"), true);

  const TabPagerDesktopSourceState state = fixture.source.sourceState();

  QCOMPARE(state.desktopSnapshot.desktops().size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops().at(0).name,
           QStringLiteral("Desktop 1"));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).name, QStringLiteral("Work"));
  QCOMPARE(state.desktopSnapshot.currentDesktop(),
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
}

void TaskManagerDesktopSourceTest::projectsMissingDesktopNamesAsEmptyNames() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("b")}, {QStringLiteral("Desktop 1")},
      QStringLiteral("b"));

  QCOMPARE(state.desktopSnapshot.desktops().size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops().at(0).name,
           QStringLiteral("Desktop 1"));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).name, QString());
}

void TaskManagerDesktopSourceTest::ignoresExtraDesktopNames() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Ignored extra name")},
      QStringLiteral("a"));

  QCOMPARE(state.desktopSnapshot.desktops().size(), 1);
  QCOMPARE(state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops().at(0).name,
           QStringLiteral("Desktop 1"));
}

void TaskManagerDesktopSourceTest::dropsInvalidDesktopIds() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QVariant{}, QStringLiteral("b")},
      {QStringLiteral("Broken"), QStringLiteral("Work")}, QStringLiteral("b"));

  QCOMPARE(state.desktopSnapshot.desktops().size(), 1);
  QCOMPARE(state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops().at(0).name, QStringLiteral("Work"));
}

void TaskManagerDesktopSourceTest::dropsDuplicateDesktopIds() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("a"), QStringLiteral("b")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Duplicate"),
       QStringLiteral("Work")},
      QStringLiteral("a"));

  QCOMPARE(state.desktopSnapshot.desktops().size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops().at(1).name, QStringLiteral("Work"));
  QCOMPARE(state.desktopSnapshot.currentDesktop(),
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
}

void TaskManagerDesktopSourceTest::clearsUnmatchedCurrentDesktop() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("b")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Work")},
      QStringLiteral("missing"));

  QCOMPARE(state.desktopSnapshot.desktops().size(), 2);
  QCOMPARE(state.desktopSnapshot.currentDesktop().isValid(), false);
}

void TaskManagerDesktopSourceTest::reportsNameCountDiagnostics() {
  const TaskManagerDesktopSourceMappingResult missingNames =
      taskManagerDesktopSourceMappingFromRawState(TaskManagerDesktopRawState{
          .desktopIds = {QStringLiteral("a"), QStringLiteral("b")},
          .desktopNames = {QStringLiteral("Desktop 1")},
          .currentDesktop = QStringLiteral("a"),
      });
  const TaskManagerDesktopSourceMappingResult extraNames =
      taskManagerDesktopSourceMappingFromRawState(TaskManagerDesktopRawState{
          .desktopIds = {QStringLiteral("a")},
          .desktopNames = {QStringLiteral("Desktop 1"),
                           QStringLiteral("Ignored extra name")},
          .currentDesktop = QStringLiteral("a"),
      });

  QCOMPARE(missingNames.diagnostics.size(), 1);
  QCOMPARE(missingNames.diagnostics.at(0).type,
           TaskManagerDesktopSourceDiagnostic::Type::MissingDesktopNames);
  QCOMPARE(missingNames.diagnostics.at(0).row, 1);
  QCOMPARE(missingNames.diagnostics.at(0).desktopIdCount, 2);
  QCOMPARE(missingNames.diagnostics.at(0).desktopNameCount, 1);

  QCOMPARE(extraNames.diagnostics.size(), 1);
  QCOMPARE(extraNames.diagnostics.at(0).type,
           TaskManagerDesktopSourceDiagnostic::Type::ExtraDesktopNames);
  QCOMPARE(extraNames.diagnostics.at(0).row, 1);
  QCOMPARE(extraNames.diagnostics.at(0).desktopIdCount, 1);
  QCOMPARE(extraNames.diagnostics.at(0).desktopNameCount, 2);
}

void TaskManagerDesktopSourceTest::reportsDesktopIdentityDiagnostics() {
  const TaskManagerDesktopSourceMappingResult result =
      taskManagerDesktopSourceMappingFromRawState(TaskManagerDesktopRawState{
          .desktopIds = {QVariant{}, QStringLiteral("a"), QStringLiteral("a")},
          .desktopNames = {QStringLiteral("Broken"), QStringLiteral("Work"),
                           QStringLiteral("Duplicate")},
          .currentDesktop = QStringLiteral("missing"),
      });

  QCOMPARE(result.state.desktopSnapshot.desktops().size(), 1);
  QCOMPARE(result.state.desktopSnapshot.desktops().at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(result.state.desktopSnapshot.currentDesktop().isValid(), false);
  QCOMPARE(result.diagnostics.size(), 3);
  QCOMPARE(result.diagnostics.at(0).type,
           TaskManagerDesktopSourceDiagnostic::Type::InvalidDesktopId);
  QCOMPARE(result.diagnostics.at(0).row, 0);
  QCOMPARE(result.diagnostics.at(1).type,
           TaskManagerDesktopSourceDiagnostic::Type::DuplicateDesktopId);
  QCOMPARE(result.diagnostics.at(1).row, 2);
  QCOMPARE(result.diagnostics.at(1).relatedRow, 1);
  QCOMPARE(result.diagnostics.at(1).desktopId, QVariant{QStringLiteral("a")});
  QCOMPARE(result.diagnostics.at(2).type,
           TaskManagerDesktopSourceDiagnostic::Type::UnmatchedCurrentDesktop);
  QCOMPARE(result.diagnostics.at(2).desktopId,
           QVariant{QStringLiteral("missing")});
}

void TaskManagerDesktopSourceTest::exposesCurrentSourceDiagnostics() {
  SourceFixture fixture({QVariant{}, QStringLiteral("a"), QStringLiteral("a")},
                        {QStringLiteral("Broken"), QStringLiteral("Work")},
                        QStringLiteral("missing"));

  const QList<TaskManagerDesktopSourceDiagnostic> diagnostics =
      fixture.source.sourceDiagnostics();

  QCOMPARE(diagnostics.size(), 4);
  QCOMPARE(diagnostics.at(0).type,
           TaskManagerDesktopSourceDiagnostic::Type::MissingDesktopNames);
  QCOMPARE(diagnostics.at(0).row, 2);
  QCOMPARE(diagnostics.at(1).type,
           TaskManagerDesktopSourceDiagnostic::Type::InvalidDesktopId);
  QCOMPARE(diagnostics.at(1).row, 0);
  QCOMPARE(diagnostics.at(2).type,
           TaskManagerDesktopSourceDiagnostic::Type::DuplicateDesktopId);
  QCOMPARE(diagnostics.at(2).row, 2);
  QCOMPARE(diagnostics.at(2).relatedRow, 1);
  QCOMPARE(diagnostics.at(2).desktopId, QVariant{QStringLiteral("a")});
  QCOMPARE(diagnostics.at(3).type,
           TaskManagerDesktopSourceDiagnostic::Type::UnmatchedCurrentDesktop);
  QCOMPARE(diagnostics.at(3).desktopId, QVariant{QStringLiteral("missing")});
}

void TaskManagerDesktopSourceTest::doesNotLogSourceDiagnosticsOnStateReads() {
  SourceFixture fixture({QVariant{}, QStringLiteral("a")},
                        {QStringLiteral("Broken"), QStringLiteral("Work")},
                        QStringLiteral("a"));
  CapturedTabPagerWarnings warnings;

  [[maybe_unused]] const TabPagerDesktopSourceState firstState =
      fixture.source.sourceState();
  [[maybe_unused]] const TabPagerDesktopSourceState secondState =
      fixture.source.sourceState();

  QCOMPARE(warnings.warningCount(), 0);
}

void TaskManagerDesktopSourceTest::
    logsSourceDiagnosticsWhenDiagnosticStateChanges() {
  CapturedTabPagerWarnings warnings;
  SourceFixture fixture({QVariant{}}, {QStringLiteral("Broken")});

  QCOMPARE(warnings.warningCount(), 1);

  fixture.info->setDesktopState(
      {QStringLiteral("a"), QStringLiteral("a")},
      {QStringLiteral("Work"), QStringLiteral("Duplicate")},
      QStringLiteral("a"));
  QCOMPARE(warnings.warningCount(), 2);

  fixture.info->setDesktopState({QStringLiteral("a")}, {QStringLiteral("Work")},
                                QStringLiteral("a"));
  QCOMPARE(warnings.warningCount(), 2);

  fixture.info->setDesktopState(
      {QStringLiteral("a"), QStringLiteral("a")},
      {QStringLiteral("Work"), QStringLiteral("Duplicate")},
      QStringLiteral("a"));
  QCOMPARE(warnings.warningCount(), 3);
}

void TaskManagerDesktopSourceTest::
    emitsSourceStateChangedWhenVirtualDesktopInfoChanges() {
  SourceFixture fixture;
  QSignalSpy spy(&fixture.source, &TabPagerDesktopSource::sourceStateChanged);

  fixture.info->setDesktopIds({QStringLiteral("a")});
  fixture.info->setDesktopNames({QStringLiteral("Work")});
  fixture.info->emitNumberOfDesktopsChanged();
  fixture.info->setCurrentDesktop(QStringLiteral("a"));
  fixture.info->setNavigationWrappingAround(true);

  QCOMPARE(spy.count(), 4);
}

void TaskManagerDesktopSourceTest::
    exposesNavigationWrappingThroughSettingsSource() {
  SourceFixture desktopFixture;
  SettingsFixture settingsFixture;
  QSignalSpy sourceStateSpy(&desktopFixture.source,
                            &TabPagerDesktopSource::sourceStateChanged);
  QSignalSpy wrappingSpy(
      &settingsFixture.source,
      &TabPagerNavigationSettingsSource::navigationWrappingAroundChanged);

  desktopFixture.info->setNavigationWrappingAround(true);
  settingsFixture.info->setNavigationWrappingAround(true);

  QCOMPARE(sourceStateSpy.count(), 0);
  QCOMPARE(wrappingSpy.count(), 1);
  QCOMPARE(settingsFixture.source.navigationWrappingAround(), true);
}

void TaskManagerDesktopSourceTest::requestsActivationForValidDesktopIdsOnly() {
  SourceFixture fixture;

  fixture.source.activateDesktop(TabPagerDesktopId{});
  fixture.source.activateDesktop(
      TabPagerDesktopId::fromVariant(QStringLiteral("a")));

  QCOMPARE(fixture.info->requestedActivations(),
           QVariantList{QStringLiteral("a")});
}

QTEST_MAIN(TaskManagerDesktopSourceTest)

#include "taskmanagerdesktopsource_test.moc"
