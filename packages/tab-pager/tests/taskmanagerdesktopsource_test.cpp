// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopid.h"
#include "taskmanagerdesktopmapper.h"
#include "taskmanagerdesktopsource.h"

#include <QSignalSpy>
#include <QTest>

#include <memory>
#include <utility>

namespace {
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

[[nodiscard]] TabPagerDesktopSourceState
sourceStateFromRawState(QVariantList desktopIds, QStringList desktopNames = {},
                        QVariant currentDesktop = {},
                        bool navigationWrappingAround = false) {
  return taskManagerDesktopSourceStateFromRawState(TaskManagerDesktopRawState{
      .desktopIds = std::move(desktopIds),
      .desktopNames = std::move(desktopNames),
      .currentDesktop = std::move(currentDesktop),
      .navigationWrappingAround = navigationWrappingAround,
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
  void emitsSourceStateChangedWhenVirtualDesktopInfoChanges();
  void requestsActivationForValidDesktopIdsOnly();
};

void TaskManagerDesktopSourceTest::projectsVirtualDesktopInfoToSourceState() {
  SourceFixture fixture({QStringLiteral("a"), QStringLiteral("b")},
                        {QStringLiteral("Desktop 1"), QStringLiteral("Work")},
                        QStringLiteral("b"), true);

  const TabPagerDesktopSourceState state = fixture.source.sourceState();

  QCOMPARE(state.desktopSnapshot.desktops.size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops.at(0).name,
           QStringLiteral("Desktop 1"));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).name, QStringLiteral("Work"));
  QCOMPARE(state.desktopSnapshot.currentDesktop,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.navigationWrappingAround, true);
}

void TaskManagerDesktopSourceTest::projectsMissingDesktopNamesAsEmptyNames() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("b")}, {QStringLiteral("Desktop 1")},
      QStringLiteral("b"));

  QCOMPARE(state.desktopSnapshot.desktops.size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops.at(0).name,
           QStringLiteral("Desktop 1"));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).name, QString());
}

void TaskManagerDesktopSourceTest::ignoresExtraDesktopNames() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Ignored extra name")},
      QStringLiteral("a"));

  QCOMPARE(state.desktopSnapshot.desktops.size(), 1);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops.at(0).name,
           QStringLiteral("Desktop 1"));
}

void TaskManagerDesktopSourceTest::dropsInvalidDesktopIds() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QVariant{}, QStringLiteral("b")},
      {QStringLiteral("Broken"), QStringLiteral("Work")}, QStringLiteral("b"));

  QCOMPARE(state.desktopSnapshot.desktops.size(), 1);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops.at(0).name, QStringLiteral("Work"));
}

void TaskManagerDesktopSourceTest::dropsDuplicateDesktopIds() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("a"), QStringLiteral("b")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Duplicate"),
       QStringLiteral("Work")},
      QStringLiteral("a"));

  QCOMPARE(state.desktopSnapshot.desktops.size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).name, QStringLiteral("Work"));
  QCOMPARE(state.desktopSnapshot.currentDesktop,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
}

void TaskManagerDesktopSourceTest::clearsUnmatchedCurrentDesktop() {
  const TabPagerDesktopSourceState state = sourceStateFromRawState(
      {QStringLiteral("a"), QStringLiteral("b")},
      {QStringLiteral("Desktop 1"), QStringLiteral("Work")},
      QStringLiteral("missing"));

  QCOMPARE(state.desktopSnapshot.desktops.size(), 2);
  QCOMPARE(state.desktopSnapshot.currentDesktop.isValid(), false);
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

  QCOMPARE(result.state.desktopSnapshot.desktops.size(), 3);
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

void TaskManagerDesktopSourceTest::
    emitsSourceStateChangedWhenVirtualDesktopInfoChanges() {
  SourceFixture fixture;
  QSignalSpy spy(&fixture.source, &TabPagerDesktopSource::sourceStateChanged);

  fixture.info->setDesktopIds({QStringLiteral("a")});
  fixture.info->setDesktopNames({QStringLiteral("Work")});
  fixture.info->emitNumberOfDesktopsChanged();
  fixture.info->setCurrentDesktop(QStringLiteral("a"));
  fixture.info->setNavigationWrappingAround(true);

  QCOMPARE(spy.count(), 5);
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
