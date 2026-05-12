// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include <QTest>

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
                      static_cast<int>(TabPagerDesktopRowRole::DesktopId),
                      static_cast<int>(TabPagerDesktopRowRole::Name),
                      static_cast<int>(TabPagerDesktopRowRole::Label),
                      static_cast<int>(TabPagerDesktopRowRole::Number),
                      static_cast<int>(TabPagerDesktopRowRole::Active),
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
      .desktopId = QStringLiteral("a"),
      .name = QStringLiteral("Desktop 1"),
      .label = QStringLiteral("1"),
      .number = 1,
      .active = true,
  };

  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, static_cast<int>(TabPagerDesktopRowRole::DesktopId)),
           QVariant(QStringLiteral("a")));
  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, static_cast<int>(TabPagerDesktopRowRole::Name)),
           QVariant(QStringLiteral("Desktop 1")));
  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, static_cast<int>(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, static_cast<int>(TabPagerDesktopRowRole::Number)),
           QVariant(1));
  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, static_cast<int>(TabPagerDesktopRowRole::Active)),
           QVariant(true));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData, Qt::UserRole), QVariant());
}

void TabPagerDesktopModelStateTest::detectsDesktopRowChangedRoles() {
  const TabPagerDesktopRowData previousRow{
      .desktopId = QStringLiteral("a"),
      .name = QStringLiteral("Desktop 1"),
      .label = QStringLiteral("1"),
      .number = 1,
      .active = false,
  };
  const TabPagerDesktopRowData nextRow{
      .desktopId = QStringLiteral("a"),
      .name = QStringLiteral("Work"),
      .label = QStringLiteral("Work"),
      .number = 1,
      .active = true,
  };

  QCOMPARE(tabPagerDesktopRowChangedRoles(previousRow, nextRow),
           (QList<int>{
               static_cast<int>(TabPagerDesktopRowRole::Name),
               static_cast<int>(TabPagerDesktopRowRole::Label),
               static_cast<int>(TabPagerDesktopRowRole::Active),
           }));
  QCOMPARE(tabPagerDesktopRowChangedRoles(previousRow, previousRow).size(), 0);
}

void TabPagerDesktopModelStateTest::plansChangedDesktopRowRoles() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
              },
          .currentDesktop = {},
      });
  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"), .name = QStringLiteral("Work")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.modelUpdate(),
           TabPagerDesktopModelChange::ModelUpdate::RowsChanged);
  QCOMPARE(change.rowUpdates().size(), 1);
  QCOMPARE(change.rowUpdates().at(0).row, 0);
  QCOMPARE(change.rowUpdates().at(0).roles,
           (QList<int>{
               static_cast<int>(TabPagerDesktopRowRole::Name),
               static_cast<int>(TabPagerDesktopRowRole::Label),
               static_cast<int>(TabPagerDesktopRowRole::Active),
           }));
}

void TabPagerDesktopModelStateTest::tracksDesktopModelStateIndex() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"), .name = QStringLiteral("Work")},
                  {.id = QStringLiteral("c"), .name = QString()},
              },
          .currentDesktop = QStringLiteral("b"),
      });

  QCOMPARE(state.count(), 3);
  QCOMPARE(state.currentIndex(), 1);
  QCOMPARE(state.hasDesktopAt(-1), false);
  QCOMPARE(state.hasDesktopAt(3), false);
  QCOMPARE(state.desktopIdAt(1), QVariant(QStringLiteral("b")));
}

void TabPagerDesktopModelStateTest::derivesDesktopModelStateRows() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"), .name = QStringLiteral("Work")},
              },
          .currentDesktop = QStringLiteral("b"),
      });

  const TabPagerDesktopRowData firstRow = state.rowData(0);
  QCOMPARE(firstRow.desktopId, QVariant(QStringLiteral("a")));
  QCOMPARE(firstRow.name, QStringLiteral("Desktop 1"));
  QCOMPARE(firstRow.label, QStringLiteral("1"));
  QCOMPARE(firstRow.number, 1);
  QCOMPARE(firstRow.active, false);

  const TabPagerDesktopRowData secondRow = state.rowData(1);
  QCOMPARE(secondRow.label, QStringLiteral("Work"));
  QCOMPARE(secondRow.active, true);
}

void TabPagerDesktopModelStateTest::plansNoChangeForSameDesktopModelSnapshot() {
  const TabPagerDesktopSnapshot snapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          },
      .currentDesktop = QStringLiteral("a"),
  };
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(snapshot);

  const TabPagerDesktopModelChange change =
      state.changeForState(TabPagerDesktopModelState::fromSnapshot(snapshot));

  QCOMPARE(change.isEmpty(), true);
  QCOMPARE(change.modelUpdate(), TabPagerDesktopModelChange::ModelUpdate::None);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowUpdates().size(), 0);
}

void TabPagerDesktopModelStateTest::
    plansNoChangeForUnmatchedCurrentDesktopChange() {
  const QList<TabPagerDesktop> desktops = {
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
  };
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops = desktops,
          .currentDesktop = QStringLiteral("missing-a"),
      });
  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops = desktops,
          .currentDesktop = QStringLiteral("missing-b"),
      });

  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.isEmpty(), true);
  QCOMPARE(change.modelUpdate(), TabPagerDesktopModelChange::ModelUpdate::None);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowUpdates().size(), 0);
}

void TabPagerDesktopModelStateTest::plansDesktopModelResetWhenCountChanges() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("b"),
      });
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.modelUpdate(),
           TabPagerDesktopModelChange::ModelUpdate::Reset);
  QCOMPARE(change.countChanged(), true);
  QCOMPARE(change.currentIndexChanged(), true);
  QCOMPARE(change.rowUpdates().size(), 0);
}

void TabPagerDesktopModelStateTest::
    plansDesktopModelResetWhenRowIdentityChanges() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("a"),
      });
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.modelUpdate(),
           TabPagerDesktopModelChange::ModelUpdate::Reset);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), true);
  QCOMPARE(change.rowUpdates().size(), 0);
}

void TabPagerDesktopModelStateTest::plansCurrentDesktopRowUpdates() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("b"),
      });
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.modelUpdate(),
           TabPagerDesktopModelChange::ModelUpdate::RowsChanged);
  QCOMPARE(change.currentIndexChanged(), true);
  QCOMPARE(change.rowUpdates().size(), 2);

  QCOMPARE(change.rowUpdates().at(0).row, 0);
  QCOMPARE(change.rowUpdates().at(0).roles,
           QList<int>{static_cast<int>(TabPagerDesktopRowRole::Active)});

  QCOMPARE(change.rowUpdates().at(1).row, 1);
  QCOMPARE(change.rowUpdates().at(1).roles,
           QList<int>{static_cast<int>(TabPagerDesktopRowRole::Active)});
}

void TabPagerDesktopModelStateTest::plansDesktopDataRowUpdates() {
  const TabPagerDesktopModelState state =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  const TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"), .name = QStringLiteral("Chat")},
              },
          .currentDesktop = QStringLiteral("a"),
      });
  const TabPagerDesktopModelChange change = state.changeForState(nextState);

  QCOMPARE(change.modelUpdate(),
           TabPagerDesktopModelChange::ModelUpdate::RowsChanged);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowUpdates().size(), 1);

  QCOMPARE(change.rowUpdates().at(0).row, 1);
  QCOMPARE(change.rowUpdates().at(0).roles,
           (QList<int>{
               static_cast<int>(TabPagerDesktopRowRole::Name),
               static_cast<int>(TabPagerDesktopRowRole::Label),
           }));
}

QTEST_MAIN(TabPagerDesktopModelStateTest)

#include "tabpagerdesktopmodelstate_test.moc"
