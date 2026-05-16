// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"
#include "tabpagertesthelpers.h"

#include <QTest>

#include <utility>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopModelState;
using TabPagerTest::desktopSnapshot;
using TabPagerTest::invalidDesktop;
using TabPagerTest::invalidDesktopId;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::unnamedDesktop;

void expectUnchanged(const TabPagerDesktopModelTransition &transition) {
  QCOMPARE(transition.type, TabPagerDesktopModelTransition::Type::Unchanged);
}

void expectReset(const TabPagerDesktopModelTransition &transition,
                 bool countChanged, bool currentIndexChanged) {
  QCOMPARE(transition.type, TabPagerDesktopModelTransition::Type::Reset);
  QCOMPARE(transition.countChanged, countChanged);
  QCOMPARE(transition.currentIndexChanged, currentIndexChanged);
}

void expectRowsChanged(const TabPagerDesktopModelTransition &transition,
                       bool currentIndexChanged, qsizetype rowUpdateCount) {
  QCOMPARE(transition.type, TabPagerDesktopModelTransition::Type::RowsChanged);
  QCOMPARE(transition.currentIndexChanged, currentIndexChanged);
  QCOMPARE(transition.rows.size(), rowUpdateCount);
}

[[nodiscard]] TabPagerDesktopModelTransition
transitionForDesktopState(const TabPagerDesktopModelState &state,
                          QList<TabPagerDesktop> desktops,
                          TabPagerDesktopId currentDesktop = {}) {
  return state.transitionForSnapshot(
      desktopSnapshot(std::move(desktops), std::move(currentDesktop)));
}
} // namespace

class TabPagerDesktopModelStateTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesDesktopRowRoleNames();
  void readsDesktopRowDataByRole();
  void detectsDesktopRowChangedRoles();
  void plansChangedDesktopRowRoles();
  void tracksDesktopModelStateIndex();
  void filtersInvalidDesktopIds();
  void derivesDesktopModelStateRows();
  void plansDesktopModelTransitionState();
  void plansNoChangeForSameDesktopModelSnapshot();
  void plansNoChangeForUnmatchedCurrentDesktopChange();
  void plansDesktopModelResetWhenCountChanges();
  void plansDesktopModelResetWhenRowIdentityChanges();
  void plansCurrentDesktopRowUpdates();
  void plansDesktopDataRowUpdates();
  void groupsAdjacentDesktopDataRowUpdates();
  void separatesDesktopDataRowUpdatesWithDifferentRoles();
};

void TabPagerDesktopModelStateTest::exposesDesktopRowRoleNames() {
  const QHash<int, QByteArray> expected = {
      {role(TabPagerDesktopRowRole::DesktopId), "desktopId"},
      {role(TabPagerDesktopRowRole::Name), "name"},
      {role(TabPagerDesktopRowRole::Label), "label"},
      {role(TabPagerDesktopRowRole::Number), "number"},
      {role(TabPagerDesktopRowRole::Active), "active"},
  };

  QCOMPARE(tabPagerDesktopRowRoleNames(), expected);
}

void TabPagerDesktopModelStateTest::readsDesktopRowDataByRole() {
  const TabPagerDesktopRowData rowData{
      .desktopId = desktopId("a"),
      .name = QStringLiteral("Desktop 1"),
      .label = QStringLiteral("1"),
      .number = 1,
      .active = true,
  };

  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, role(TabPagerDesktopRowRole::DesktopId)),
           desktopId("a").toVariant());
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Name)),
           QVariant(QStringLiteral("Desktop 1")));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Number)),
           QVariant(1));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData, Qt::UserRole), QVariant());
}

void TabPagerDesktopModelStateTest::detectsDesktopRowChangedRoles() {
  const TabPagerDesktopRowData previousRow{
      .desktopId = desktopId("a"),
      .name = QStringLiteral("Desktop 1"),
      .label = QStringLiteral("1"),
      .number = 1,
      .active = false,
  };
  const TabPagerDesktopRowData nextRow{
      .desktopId = desktopId("a"),
      .name = QStringLiteral("Work"),
      .label = QStringLiteral("Work"),
      .number = 1,
      .active = true,
  };

  QCOMPARE(tabPagerDesktopRowChangedRoles(previousRow, nextRow),
           (QList<int>{
               role(TabPagerDesktopRowRole::Name),
               role(TabPagerDesktopRowRole::Label),
               role(TabPagerDesktopRowRole::Active),
           }));
  QCOMPARE(tabPagerDesktopRowChangedRoles(previousRow, previousRow).size(), 0);
}

void TabPagerDesktopModelStateTest::plansChangedDesktopRowRoles() {
  const TabPagerDesktopModelState state =
      desktopModelState({defaultDesktop("a", 1)});

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {namedDesktop("a", "Work")}, desktopId("a"));

  expectRowsChanged(transition, true, 1);
  const QList<TabPagerDesktopModelRowUpdate> &rowUpdates = transition.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 0);
  QCOMPARE(rowUpdates.at(0).lastRow, 0);
  QCOMPARE(rowUpdates.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                       role(TabPagerDesktopRowRole::Active),
                                   }));
}

void TabPagerDesktopModelStateTest::tracksDesktopModelStateIndex() {
  const TabPagerDesktopModelState state = desktopModelState(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
          unnamedDesktop("c"),
      },
      desktopId("b"));

  QCOMPARE(state.count(), 3);
  QCOMPARE(state.currentIndex(), 1);
  QCOMPARE(state.desktopIdForIndex(-1).has_value(), false);
  QCOMPARE(state.desktopIdForIndex(3).has_value(), false);
  QCOMPARE(state.desktopIdForIndex(1).value_or(TabPagerDesktopId{}),
           desktopId("b"));
}

void TabPagerDesktopModelStateTest::filtersInvalidDesktopIds() {
  const TabPagerDesktopModelState state = desktopModelState(
      {
          invalidDesktop(QStringLiteral("Broken")),
          defaultDesktop("b", 2),
      },
      desktopId("b"));

  QCOMPARE(state.count(), 1);
  QCOMPARE(state.currentIndex(), 0);
  QCOMPARE(state.desktopIdForIndex(0).value_or(TabPagerDesktopId{}),
           desktopId("b"));

  const TabPagerDesktopRowData row = state.rowData(0);
  QCOMPARE(row.number, 2);
  QCOMPARE(row.label, QStringLiteral("2"));
  QCOMPARE(row.active, true);
}

void TabPagerDesktopModelStateTest::derivesDesktopModelStateRows() {
  const TabPagerDesktopModelState state = desktopModelState(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
      },
      desktopId("b"));

  const TabPagerDesktopRowData firstRow = state.rowData(0);
  QCOMPARE(firstRow.desktopId, desktopId("a"));
  QCOMPARE(firstRow.name, QStringLiteral("Desktop 1"));
  QCOMPARE(firstRow.label, QStringLiteral("1"));
  QCOMPARE(firstRow.number, 1);
  QCOMPARE(firstRow.active, false);

  const TabPagerDesktopRowData secondRow = state.rowData(1);
  QCOMPARE(secondRow.label, QStringLiteral("Work"));
  QCOMPARE(secondRow.active, true);
}

void TabPagerDesktopModelStateTest::plansDesktopModelTransitionState() {
  const TabPagerDesktopModelState state;

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {defaultDesktop("a", 1), namedDesktop("b", "Work")},
      desktopId("b"));

  QCOMPARE(transition.nextState.count(), 2);
  QCOMPARE(transition.nextState.currentIndex(), 1);
  QCOMPARE(transition.nextState.rowData(1).label, QStringLiteral("Work"));
  expectReset(transition, true, true);
}

void TabPagerDesktopModelStateTest::plansNoChangeForSameDesktopModelSnapshot() {
  const TabPagerDesktopSnapshot snapshot =
      desktopSnapshot({defaultDesktop("a", 1)}, desktopId("a"));
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(snapshot);

  const TabPagerDesktopModelTransition transition =
      state.transitionForSnapshot(snapshot);

  expectUnchanged(transition);
}

void TabPagerDesktopModelStateTest::
    plansNoChangeForUnmatchedCurrentDesktopChange() {
  const QList<TabPagerDesktop> desktops = {
      defaultDesktop("a", 1),
  };
  const TabPagerDesktopModelState state =
      desktopModelState(desktops, desktopId("missing-a"));

  const TabPagerDesktopModelTransition transition =
      transitionForDesktopState(state, desktops, desktopId("missing-b"));

  expectUnchanged(transition);
}

void TabPagerDesktopModelStateTest::plansDesktopModelResetWhenCountChanges() {
  const TabPagerDesktopModelState state =
      desktopModelState({defaultDesktop("a", 1)}, desktopId("a"));

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("b"));

  expectReset(transition, true, true);
}

void TabPagerDesktopModelStateTest::
    plansDesktopModelResetWhenRowIdentityChanges() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {defaultDesktop("b", 1), defaultDesktop("a", 2)}, desktopId("a"));

  expectReset(transition, false, true);
}

void TabPagerDesktopModelStateTest::plansCurrentDesktopRowUpdates() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("b"));

  expectRowsChanged(transition, true, 1);

  const QList<TabPagerDesktopModelRowUpdate> &rowUpdates = transition.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 0);
  QCOMPARE(rowUpdates.at(0).lastRow, 1);
  QCOMPARE(rowUpdates.at(0).roles,
           QList<int>{role(TabPagerDesktopRowRole::Active)});
}

void TabPagerDesktopModelStateTest::plansDesktopDataRowUpdates() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {defaultDesktop("a", 1), namedDesktop("b", "Chat")},
      desktopId("a"));

  expectRowsChanged(transition, false, 1);

  const QList<TabPagerDesktopModelRowUpdate> &rowUpdates = transition.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 1);
  QCOMPARE(rowUpdates.at(0).lastRow, 1);
  QCOMPARE(rowUpdates.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                   }));
}

void TabPagerDesktopModelStateTest::groupsAdjacentDesktopDataRowUpdates() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {namedDesktop("a", "Mail"), namedDesktop("b", "Chat")},
      desktopId("a"));

  expectRowsChanged(transition, false, 1);

  const QList<TabPagerDesktopModelRowUpdate> &rowUpdates = transition.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 0);
  QCOMPARE(rowUpdates.at(0).lastRow, 1);
  QCOMPARE(rowUpdates.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                   }));
}

void TabPagerDesktopModelStateTest::
    separatesDesktopDataRowUpdatesWithDifferentRoles() {
  const TabPagerDesktopModelState state =
      desktopModelState({defaultDesktop("a", 1), defaultDesktop("b", 2)});

  const TabPagerDesktopModelTransition transition = transitionForDesktopState(
      state, {namedDesktop("a", "Mail"), defaultDesktop("b", 2)},
      desktopId("b"));

  expectRowsChanged(transition, true, 2);

  const QList<TabPagerDesktopModelRowUpdate> &rowUpdates = transition.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 0);
  QCOMPARE(rowUpdates.at(0).lastRow, 0);
  QCOMPARE(rowUpdates.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                   }));
  QCOMPARE(rowUpdates.at(1).firstRow, 1);
  QCOMPARE(rowUpdates.at(1).lastRow, 1);
  QCOMPARE(rowUpdates.at(1).roles,
           QList<int>{role(TabPagerDesktopRowRole::Active)});
}

QTEST_MAIN(TabPagerDesktopModelStateTest)

#include "tabpagerdesktopmodelstate_test.moc"
