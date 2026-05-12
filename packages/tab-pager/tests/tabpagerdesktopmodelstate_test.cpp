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
  void plansDesktopModelResetWhenCountChanges();
  void plansCurrentDesktopRowUpdates();
  void plansDesktopDataRowUpdates();
};

void TabPagerDesktopModelStateTest::tracksDesktopModelStateIndex() {
  TabPagerDesktopModelState state;
  state.setSnapshot(TabPagerDesktopSnapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
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
  TabPagerDesktopModelState state;
  state.setSnapshot(TabPagerDesktopSnapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
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
  TabPagerDesktopModelState state;
  state.setSnapshot(snapshot);

  const TabPagerDesktopSnapshotChange change =
      state.changeForSnapshot(snapshot);

  QCOMPARE(change.operation, TabPagerDesktopSnapshotChange::Operation::None);
  QCOMPARE(change.countChanged, false);
  QCOMPARE(change.currentIndexChanged, false);
  QCOMPARE(change.rowChanges.size(), 0);
}

void TabPagerDesktopModelStateTest::plansDesktopModelResetWhenCountChanges() {
  TabPagerDesktopModelState state;
  state.setSnapshot(TabPagerDesktopSnapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          },
      .currentDesktop = QStringLiteral("a"),
  });

  const TabPagerDesktopSnapshotChange change =
      state.changeForSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("b"),
      });

  QCOMPARE(change.operation, TabPagerDesktopSnapshotChange::Operation::Reset);
  QCOMPARE(change.countChanged, true);
  QCOMPARE(change.currentIndexChanged, true);
  QCOMPARE(change.rowChanges.size(), 0);
}

void TabPagerDesktopModelStateTest::plansCurrentDesktopRowUpdates() {
  TabPagerDesktopModelState state;
  state.setSnapshot(TabPagerDesktopSnapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
              {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
          },
      .currentDesktop = QStringLiteral("a"),
  });

  const TabPagerDesktopSnapshotChange change =
      state.changeForSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("b"),
                   .name = QStringLiteral("Desktop 2")},
              },
          .currentDesktop = QStringLiteral("b"),
      });

  QCOMPARE(change.operation,
           TabPagerDesktopSnapshotChange::Operation::UpdateRows);
  QCOMPARE(change.currentIndexChanged, true);
  QCOMPARE(change.rowChanges.size(), 2);

  QCOMPARE(change.rowChanges.at(0).row, 0);
  QCOMPARE(change.rowChanges.at(0).nextRow.active, false);

  QCOMPARE(change.rowChanges.at(1).row, 1);
  QCOMPARE(change.rowChanges.at(1).nextRow.active, true);
}

void TabPagerDesktopModelStateTest::plansDesktopDataRowUpdates() {
  TabPagerDesktopModelState state;
  state.setSnapshot(TabPagerDesktopSnapshot{
      .desktops =
          {
              {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
              {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
          },
      .currentDesktop = QStringLiteral("a"),
  });

  const TabPagerDesktopSnapshotChange change =
      state.changeForSnapshot(TabPagerDesktopSnapshot{
          .desktops =
              {
                  {.id = QStringLiteral("a"),
                   .name = QStringLiteral("Desktop 1")},
                  {.id = QStringLiteral("c"), .name = QStringLiteral("Chat")},
              },
          .currentDesktop = QStringLiteral("a"),
      });

  QCOMPARE(change.operation,
           TabPagerDesktopSnapshotChange::Operation::UpdateRows);
  QCOMPARE(change.countChanged, false);
  QCOMPARE(change.currentIndexChanged, false);
  QCOMPARE(change.rowChanges.size(), 1);

  QCOMPARE(change.rowChanges.at(0).row, 1);
  QCOMPARE(change.rowChanges.at(0).previousRow.desktopId,
           QVariant(QStringLiteral("b")));
  QCOMPARE(change.rowChanges.at(0).nextRow.desktopId,
           QVariant(QStringLiteral("c")));
  QCOMPARE(change.rowChanges.at(0).nextRow.label, QStringLiteral("Chat"));
}

QTEST_MAIN(TabPagerDesktopModelStateTest)

#include "tabpagerdesktopmodelstate_test.moc"
