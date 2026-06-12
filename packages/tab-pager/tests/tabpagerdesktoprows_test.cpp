// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprows.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::compareDesktopRow;
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopSnapshot;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::unnamedDesktop;
} // namespace

class TabPagerDesktopRowsTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void projectsSnapshotToRows();
  void detectsChangedRowRanges();
  void rejectsChangedIdentityForRowDiffs();
};

void TabPagerDesktopRowsTest::projectsSnapshotToRows() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), namedDesktop("b", "Work"),
                       unnamedDesktop("c")},
                      desktopId("b")));

  QCOMPARE(rows.count(), 3);
  QCOMPARE(rows.currentIndex(), 1);
  compareDesktopRow(rows.rowData(0), desktopId("a"),
                    QStringLiteral("Desktop 1"), QStringLiteral("1"), 1, false);
  compareDesktopRow(rows.rowData(1), desktopId("b"), QStringLiteral("Work"),
                    QStringLiteral("Work"), 2, true);
  QCOMPARE(rows.rowData(2).label, QStringLiteral("3"));
}

void TabPagerDesktopRowsTest::detectsChangedRowRanges() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2),
                       defaultDesktop("c", 3)}));
  const TabPagerDesktopRows nextRows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({namedDesktop("a", "Mail"), namedDesktop("b", "Chat"),
                       defaultDesktop("c", 3)},
                      desktopId("c")));

  const std::optional<QList<TabPagerDesktopRowsChange>> rowChanges =
      rows.changesTo(nextRows);

  QVERIFY(rowChanges.has_value());
  QCOMPARE(rowChanges->size(), 2);
  QCOMPARE(rowChanges->at(0).firstRow, 0);
  QCOMPARE(rowChanges->at(0).lastRow, 1);
  QCOMPARE(rowChanges->at(0).roles, (QList<int>{
                                        role(TabPagerDesktopRowRole::Name),
                                        role(TabPagerDesktopRowRole::Label),
                                    }));
  QCOMPARE(rowChanges->at(1).firstRow, 2);
  QCOMPARE(rowChanges->at(1).lastRow, 2);
  QCOMPARE(rowChanges->at(1).roles,
           QList<int>{role(TabPagerDesktopRowRole::Active)});
}

void TabPagerDesktopRowsTest::rejectsChangedIdentityForRowDiffs() {
  const TabPagerDesktopRows rows = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2)}));
  const TabPagerDesktopRows reordered = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("b", 1), defaultDesktop("a", 2)}));
  const TabPagerDesktopRows added = TabPagerDesktopRows::fromSnapshot(
      desktopSnapshot({defaultDesktop("a", 1), defaultDesktop("b", 2),
                       defaultDesktop("c", 3)}));

  QCOMPARE(rows.changesTo(reordered).has_value(), false);
  QCOMPARE(rows.changesTo(added).has_value(), false);
}

QTEST_MAIN(TabPagerDesktopRowsTest)

#include "tabpagerdesktoprows_test.moc"
