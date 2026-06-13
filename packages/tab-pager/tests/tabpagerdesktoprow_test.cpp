// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprow.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::desktopId;
using TabPagerTest::role;
} // namespace

class TabPagerDesktopRowTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesDesktopRowRoleNames();
  void readsDesktopRowDataByRole();
  void detectsDesktopRowChangedRoles();
};

void TabPagerDesktopRowTest::exposesDesktopRowRoleNames() {
  const QHash<int, QByteArray> expected = {
      {role(TabPagerDesktopRowRole::Label), "label"},
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

  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
  QCOMPARE(tabPagerDesktopRowDataForRole(
               rowData, role(TabPagerDesktopRowRole::DesktopId)),
           QVariant());
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Name)),
           QVariant());
  QCOMPARE(tabPagerDesktopRowDataForRole(rowData,
                                         role(TabPagerDesktopRowRole::Number)),
           QVariant());
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
               role(TabPagerDesktopRowRole::Label),
               role(TabPagerDesktopRowRole::Active),
           }));
  QCOMPARE(tabPagerDesktopRowChangedRoles(previousRow, previousRow).size(), 0);
}

QTEST_MAIN(TabPagerDesktopRowTest)

#include "tabpagerdesktoprow_test.moc"
