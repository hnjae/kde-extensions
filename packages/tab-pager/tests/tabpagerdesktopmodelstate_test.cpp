// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopModelState;
using TabPagerTest::desktopSnapshot;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::unnamedDesktop;

void expectUnchanged(const TabPagerDesktopModelChange &change) {
  QCOMPARE(change.type, TabPagerDesktopModelChange::Type::Unchanged);
}

void expectReset(const TabPagerDesktopModelChange &change, bool countChanged,
                 bool currentIndexChanged) {
  QCOMPARE(change.type, TabPagerDesktopModelChange::Type::Reset);
  QCOMPARE(change.countChanged, countChanged);
  QCOMPARE(change.currentIndexChanged, currentIndexChanged);
}

void expectRowsChanged(const TabPagerDesktopModelChange &change,
                       bool currentIndexChanged, qsizetype rowUpdateCount) {
  QCOMPARE(change.type, TabPagerDesktopModelChange::Type::RowsChanged);
  QCOMPARE(change.currentIndexChanged, currentIndexChanged);
  QCOMPARE(change.rows.size(), rowUpdateCount);
}
} // namespace

class TabPagerDesktopModelStateTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesDesktopRowRoleDefinitions();
  void readsDesktopRowDataByRole();
  void detectsDesktopRowChangedRoles();
  void plansChangedDesktopRowRoles();
  void tracksDesktopModelStateIndex();
  void derivesDesktopModelStateRows();
  void plansNoChangeForSameDesktopModelSnapshot();
  void plansNoChangeForUnmatchedCurrentDesktopChange();
  void plansDesktopModelResetWhenCountChanges();
  void plansDesktopModelResetWhenRowIdentityChanges();
  void plansCurrentDesktopRowUpdates();
  void plansDesktopDataRowUpdates();
};

void TabPagerDesktopModelStateTest::exposesDesktopRowRoleDefinitions() {
  QList<int> roles;
  QList<QByteArray> names;

  for (const TabPagerDesktopRowRoleDefinition &definition :
       tabPagerDesktopRowRoleDefinitions()) {
    roles.append(definition.role);
    names.append(definition.name);
  }

  QCOMPARE(roles, (QList<int>{
                      role(TabPagerDesktopRowRole::DesktopId),
                      role(TabPagerDesktopRowRole::Name),
                      role(TabPagerDesktopRowRole::Label),
                      role(TabPagerDesktopRowRole::Number),
                      role(TabPagerDesktopRowRole::Active),
                  }));
  QCOMPARE(names, (QList<QByteArray>{
                      "desktopId",
                      "name",
                      "label",
                      "number",
                      "active",
                  }));
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
           desktopId("a"));
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
  const TabPagerDesktopModelState nextState =
      desktopModelState({namedDesktop("a", "Work")}, desktopId("a"));

  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectRowsChanged(change, true, 1);
  const QList<TabPagerDesktopRowUpdate> &rowUpdates = change.rows;
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
  QCOMPARE(state.desktopIdForIndex(1).value_or(QVariant()), desktopId("b"));
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

void TabPagerDesktopModelStateTest::plansNoChangeForSameDesktopModelSnapshot() {
  const TabPagerDesktopSnapshot snapshot =
      desktopSnapshot({defaultDesktop("a", 1)}, desktopId("a"));
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(snapshot);

  const TabPagerDesktopModelChange change =
      state.changeForState(TabPagerDesktopModelState::fromSnapshot(snapshot));

  expectUnchanged(change);
}

void TabPagerDesktopModelStateTest::
    plansNoChangeForUnmatchedCurrentDesktopChange() {
  const QList<TabPagerDesktop> desktops = {
      defaultDesktop("a", 1),
  };
  const TabPagerDesktopModelState state =
      desktopModelState(desktops, desktopId("missing-a"));
  const TabPagerDesktopModelState nextState =
      desktopModelState(desktops, desktopId("missing-b"));

  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectUnchanged(change);
}

void TabPagerDesktopModelStateTest::plansDesktopModelResetWhenCountChanges() {
  const TabPagerDesktopModelState state =
      desktopModelState({defaultDesktop("a", 1)}, desktopId("a"));

  const TabPagerDesktopModelState nextState = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("b"));
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectReset(change, true, true);
}

void TabPagerDesktopModelStateTest::
    plansDesktopModelResetWhenRowIdentityChanges() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelState nextState = desktopModelState(
      {defaultDesktop("b", 1), defaultDesktop("a", 2)}, desktopId("a"));
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectReset(change, false, true);
}

void TabPagerDesktopModelStateTest::plansCurrentDesktopRowUpdates() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelState nextState = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("b"));
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectRowsChanged(change, true, 1);

  const QList<TabPagerDesktopRowUpdate> &rowUpdates = change.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 0);
  QCOMPARE(rowUpdates.at(0).lastRow, 1);
  QCOMPARE(rowUpdates.at(0).roles,
           QList<int>{role(TabPagerDesktopRowRole::Active)});
}

void TabPagerDesktopModelStateTest::plansDesktopDataRowUpdates() {
  const TabPagerDesktopModelState state = desktopModelState(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a"));

  const TabPagerDesktopModelState nextState = desktopModelState(
      {defaultDesktop("a", 1), namedDesktop("b", "Chat")}, desktopId("a"));
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  expectRowsChanged(change, false, 1);

  const QList<TabPagerDesktopRowUpdate> &rowUpdates = change.rows;
  QCOMPARE(rowUpdates.at(0).firstRow, 1);
  QCOMPARE(rowUpdates.at(0).lastRow, 1);
  QCOMPARE(rowUpdates.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                   }));
}

QTEST_MAIN(TabPagerDesktopModelStateTest)

#include "tabpagerdesktopmodelstate_test.moc"
