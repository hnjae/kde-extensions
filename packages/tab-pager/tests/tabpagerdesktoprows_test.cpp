// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprows.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopSnapshot;
using TabPagerTest::invalidDesktop;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::unnamedDesktop;
} // namespace

class TabPagerDesktopRowsTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void projectsSnapshotToRows();
  void filtersInvalidDesktopIdsFromRows();
  void detectsStableRowIdentity();
  void detectsChangedRowRanges();
};

void TabPagerDesktopRowsTest::projectsSnapshotToRows() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), namedDesktop("b", "Work"),
                       unnamedDesktop("c")},
                      desktopId("b")));

  QCOMPARE(rows.count(), 3);
  QCOMPARE(rows.currentIndex(), 1);
  QCOMPARE(rows.rowData(0).desktopId, desktopId("a"));
  QCOMPARE(rows.rowData(0).name, QStringLiteral("Desktop 1"));
  QCOMPARE(rows.rowData(0).label, QStringLiteral("1"));
  QCOMPARE(rows.rowData(0).number, 1);
  QCOMPARE(rows.rowData(0).active, false);
  QCOMPARE(rows.rowData(1).desktopId, desktopId("b"));
  QCOMPARE(rows.rowData(1).name, QStringLiteral("Work"));
  QCOMPARE(rows.rowData(1).label, QStringLiteral("Work"));
  QCOMPARE(rows.rowData(1).number, 2);
  QCOMPARE(rows.rowData(1).active, true);
  QCOMPARE(rows.rowData(2).label, QStringLiteral("3"));
}

void TabPagerDesktopRowsTest::filtersInvalidDesktopIdsFromRows() {
  const TabPagerDesktopRows rows =
      TabPagerDesktopRows::fromSnapshot(desktopSnapshot(
          {invalidDesktop(QStringLiteral("Broken")), defaultDesktop("b", 2)},
          desktopId("b")));

  QCOMPARE(rows.count(), 1);
  QCOMPARE(rows.currentIndex(), 0);
  QCOMPARE(rows.rowData(0).desktopId, desktopId("b"));
  QCOMPARE(rows.rowData(0).name, QStringLiteral("Desktop 2"));
  QCOMPARE(rows.rowData(0).label, QStringLiteral("2"));
  QCOMPARE(rows.rowData(0).number, 2);
  QCOMPARE(rows.rowData(0).active, true);
  QCOMPARE(rows.desktopIdForIndex(-1).has_value(), false);
  QCOMPARE(rows.desktopIdForIndex(1).has_value(), false);
  QCOMPARE(rows.desktopIdForIndex(0).value_or(TabPagerDesktopId{}),
           desktopId("b"));
}

void TabPagerDesktopRowsTest::detectsStableRowIdentity() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2)}));
  const TabPagerDesktopRows sameIdentity = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({namedDesktop("a", "Work"), defaultDesktop("b", 2)}));
  const TabPagerDesktopRows reordered = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("b", 1), defaultDesktop("a", 2)}));
  const TabPagerDesktopRows added = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2),
                       defaultDesktop("c", 3)}));

  QCOMPARE(rows.hasSameIdentityAs(sameIdentity), true);
  QCOMPARE(rows.hasSameIdentityAs(reordered), false);
  QCOMPARE(rows.hasSameIdentityAs(added), false);
}

void TabPagerDesktopRowsTest::detectsChangedRowRanges() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2),
                       defaultDesktop("c", 3)}));
  const TabPagerDesktopRows nextRows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({namedDesktop("a", "Mail"), namedDesktop("b", "Chat"),
                       defaultDesktop("c", 3)},
                      desktopId("c")));

  const QList<TabPagerDesktopRowsChange> rowChanges = rows.changesTo(nextRows);

  QCOMPARE(rowChanges.size(), 2);
  QCOMPARE(rowChanges.at(0).firstRow, 0);
  QCOMPARE(rowChanges.at(0).lastRow, 1);
  QCOMPARE(rowChanges.at(0).roles, (QList<int>{
                                       role(TabPagerDesktopRowRole::Name),
                                       role(TabPagerDesktopRowRole::Label),
                                   }));
  QCOMPARE(rowChanges.at(1).firstRow, 2);
  QCOMPARE(rowChanges.at(1).lastRow, 2);
  QCOMPARE(rowChanges.at(1).roles,
           QList<int>{role(TabPagerDesktopRowRole::Active)});
}

QTEST_MAIN(TabPagerDesktopRowsTest)

#include "tabpagerdesktoprows_test.moc"
