// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprow.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopSnapshot;
using TabPagerTest::invalidDesktop;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
} // namespace

class TabPagerDesktopRowTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesDesktopRowRoleNames();
  void readsDesktopRowDataByRole();
  void detectsDesktopRowChangedRoles();
  void filtersInvalidDesktopIds();
  void derivesRowsFromSnapshot();
};

void TabPagerDesktopRowTest::exposesDesktopRowRoleNames() {
  const QHash<int, QByteArray> expected = {
      {role(TabPagerDesktopRowRole::DesktopId), "desktopId"},
      {role(TabPagerDesktopRowRole::Name), "name"},
      {role(TabPagerDesktopRowRole::Label), "label"},
      {role(TabPagerDesktopRowRole::Number), "number"},
      {role(TabPagerDesktopRowRole::Active), "active"},
  };

  QCOMPARE(tabPagerDesktopRowRoleNames(), expected);
}

void TabPagerDesktopRowTest::readsDesktopRowDataByRole() {
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

void TabPagerDesktopRowTest::detectsDesktopRowChangedRoles() {
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

void TabPagerDesktopRowTest::filtersInvalidDesktopIds() {
  const QList<TabPagerDesktopRowData> rows =
      tabPagerDesktopRowsForSnapshot(desktopSnapshot(
          {invalidDesktop(QStringLiteral("Broken")), defaultDesktop("b", 2)},
          desktopId("b")));

  QCOMPARE(rows.size(), 1);
  QCOMPARE(rows.at(0).desktopId, desktopId("b"));
  QCOMPARE(rows.at(0).number, 2);
  QCOMPARE(rows.at(0).label, QStringLiteral("2"));
  QCOMPARE(rows.at(0).active, true);
}

void TabPagerDesktopRowTest::derivesRowsFromSnapshot() {
  const QList<TabPagerDesktopRowData> rows =
      tabPagerDesktopRowsForSnapshot(desktopSnapshot(
          {defaultDesktop("a", 1), namedDesktop("b", "Work")}, desktopId("b")));

  QCOMPARE(rows.size(), 2);
  QCOMPARE(rows.at(0).desktopId, desktopId("a"));
  QCOMPARE(rows.at(0).name, QStringLiteral("Desktop 1"));
  QCOMPARE(rows.at(0).label, QStringLiteral("1"));
  QCOMPARE(rows.at(0).number, 1);
  QCOMPARE(rows.at(0).active, false);

  QCOMPARE(rows.at(1).desktopId, desktopId("b"));
  QCOMPARE(rows.at(1).label, QStringLiteral("Work"));
  QCOMPARE(rows.at(1).active, true);
}

QTEST_MAIN(TabPagerDesktopRowTest)

#include "tabpagerdesktoprow_test.moc"
