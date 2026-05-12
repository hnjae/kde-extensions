// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include <QTest>

class TabPagerDesktopModelStateTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void tracksDesktopModelStateIndex();
  void derivesDesktopModelStateRows();
  void plansNoChangeForSameDesktopModelSnapshot();
  void plansNoChangeForUnmatchedCurrentDesktopChange();
  void plansDesktopModelResetWhenCountChanges();
  void plansCurrentDesktopRowUpdates();
  void plansDesktopDataRowUpdates();
};

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

  const TabPagerDesktopSnapshotChange change =
      state.changeForState(TabPagerDesktopModelState::fromSnapshot(snapshot));

  QCOMPARE(change.isEmpty(), true);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowChanges().size(), 0);
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

  const TabPagerDesktopSnapshotChange change = state.changeForState(nextState);

  QCOMPARE(change.isEmpty(), true);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowChanges().size(), 0);
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
  const TabPagerDesktopSnapshotChange change = state.changeForState(nextState);

  QCOMPARE(change.requiresModelReset(), true);
  QCOMPARE(change.countChanged(), true);
  QCOMPARE(change.currentIndexChanged(), true);
  QCOMPARE(change.rowChanges().size(), 0);
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
  const TabPagerDesktopSnapshotChange change = state.changeForState(nextState);

  QCOMPARE(change.updatesRows(), true);
  QCOMPARE(change.currentIndexChanged(), true);
  QCOMPARE(change.rowChanges().size(), 2);

  QCOMPARE(change.rowChanges().at(0).row, 0);
  QCOMPARE(change.rowChanges().at(0).nextRow.active, false);

  QCOMPARE(change.rowChanges().at(1).row, 1);
  QCOMPARE(change.rowChanges().at(1).nextRow.active, true);
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
                  {.id = QStringLiteral("c"), .name = QStringLiteral("Chat")},
              },
          .currentDesktop = QStringLiteral("a"),
      });
  const TabPagerDesktopSnapshotChange change = state.changeForState(nextState);

  QCOMPARE(change.updatesRows(), true);
  QCOMPARE(change.countChanged(), false);
  QCOMPARE(change.currentIndexChanged(), false);
  QCOMPARE(change.rowChanges().size(), 1);

  QCOMPARE(change.rowChanges().at(0).row, 1);
  QCOMPARE(change.rowChanges().at(0).previousRow.desktopId,
           QVariant(QStringLiteral("b")));
  QCOMPARE(change.rowChanges().at(0).nextRow.desktopId,
           QVariant(QStringLiteral("c")));
  QCOMPARE(change.rowChanges().at(0).nextRow.label, QStringLiteral("Chat"));
}

QTEST_MAIN(TabPagerDesktopModelStateTest)

#include "tabpagerdesktopmodelstate_test.moc"
