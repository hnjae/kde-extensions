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

void expectDesktopRow(const TabPagerDesktopRowData &row,
                      const TabPagerDesktopId &desktopId, const QString &name,
                      const QString &label, int number, bool active) {
  QCOMPARE(row.desktopId, desktopId);
  QCOMPARE(row.name, name);
  QCOMPARE(row.label, label);
  QCOMPARE(row.number, number);
  QCOMPARE(row.active, active);
}
} // namespace

class TabPagerDesktopRowTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void projectsDesktopSnapshotToRows();
  void filtersInvalidDesktopIdsFromRows();
  void exposesDesktopRowRoleNames();
  void readsDesktopRowDataByRole();
  void detectsDesktopRowChangedRoles();
};

void TabPagerDesktopRowTest::projectsDesktopSnapshotToRows() {
  const QList<TabPagerDesktopRowData> rows =
      tabPagerDesktopRowsForSnapshot(desktopSnapshot(
          {defaultDesktop("a", 1), namedDesktop("b", "Work")}, desktopId("b")));

  QCOMPARE(rows.size(), 2);
  expectDesktopRow(rows.at(0), desktopId("a"), QStringLiteral("Desktop 1"),
                   QStringLiteral("1"), 1, false);
  expectDesktopRow(rows.at(1), desktopId("b"), QStringLiteral("Work"),
                   QStringLiteral("Work"), 2, true);
}

void TabPagerDesktopRowTest::filtersInvalidDesktopIdsFromRows() {
  const QList<TabPagerDesktopRowData> rows =
      tabPagerDesktopRowsForSnapshot(desktopSnapshot(
          {invalidDesktop(QStringLiteral("Broken")), defaultDesktop("b", 2)},
          desktopId("b")));

  QCOMPARE(rows.size(), 1);
  expectDesktopRow(rows.at(0), desktopId("b"), QStringLiteral("Desktop 2"),
                   QStringLiteral("2"), 2, true);
}

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

QTEST_MAIN(TabPagerDesktopRowTest)

#include "tabpagerdesktoprow_test.moc"
