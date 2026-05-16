// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodel.h"
#include "tabpagertesthelpers.h"

#include <QSignalSpy>
#include <QTest>

namespace {
using TabPagerTest::DataChangedEmission;
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::desktopRows;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::takeDataChangedEmission;

void expectNoStructuralSignals(const QSignalSpy &countSpy,
                               const QSignalSpy &currentSpy,
                               const QSignalSpy &resetSpy) {
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(currentSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 0);
}

void expectDataChangedEmission(QSignalSpy &dataSpy, int firstRow, int lastRow,
                               const QList<int> &roles) {
  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, firstRow);
  QCOMPARE(emission.lastRow, lastRow);
  QCOMPARE(emission.roles, roles);
}
} // namespace

class TabPagerDesktopModelTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesDesktopRowsAsListModel();
  void resetsWhenDesktopIdentityChanges();
  void updatesRowsWithoutReset();
  void emitsCurrentIndexChangeForActiveDesktopUpdates();
};

void TabPagerDesktopModelTest::exposesDesktopRowsAsListModel() {
  TabPagerDesktopModel model;

  model.setDesktopRows(desktopRows(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
      },
      desktopId("b")));

  QCOMPARE(model.count(), 2);
  QCOMPARE(model.rowCount(), 2);
  QCOMPARE(model.currentIndex(), 1);
  QCOMPARE(model.data(model.index(0), role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Work")));
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerDesktopModelTest::resetsWhenDesktopIdentityChanges() {
  TabPagerDesktopModel model;
  model.setDesktopRows(desktopRows(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a")));
  QSignalSpy countSpy(&model, &TabPagerDesktopModel::countChanged);
  QSignalSpy currentSpy(&model, &TabPagerDesktopModel::currentIndexChanged);
  QSignalSpy resetSpy(&model, &QAbstractItemModel::modelReset);

  model.setDesktopRows(desktopRows(
      {defaultDesktop("b", 1), defaultDesktop("a", 2)}, desktopId("a")));

  QCOMPARE(model.count(), 2);
  QCOMPARE(model.currentIndex(), 1);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(resetSpy.count(), 1);
}

void TabPagerDesktopModelTest::updatesRowsWithoutReset() {
  TabPagerDesktopModel model;
  model.setDesktopRows(desktopRows(
      {defaultDesktop("a", 1), defaultDesktop("b", 2)}, desktopId("a")));
  QSignalSpy countSpy(&model, &TabPagerDesktopModel::countChanged);
  QSignalSpy currentSpy(&model, &TabPagerDesktopModel::currentIndexChanged);
  QSignalSpy resetSpy(&model, &QAbstractItemModel::modelReset);
  QSignalSpy dataSpy(&model, &QAbstractItemModel::dataChanged);

  model.setDesktopRows(desktopRows(
      {defaultDesktop("a", 1), namedDesktop("b", "Chat")}, desktopId("a")));

  QCOMPARE(model.count(), 2);
  QCOMPARE(model.currentIndex(), 0);
  expectNoStructuralSignals(countSpy, currentSpy, resetSpy);
  expectDataChangedEmission(dataSpy, 1, 1,
                            QList<int>{
                                role(TabPagerDesktopRowRole::Name),
                                role(TabPagerDesktopRowRole::Label),
                            });
}

void TabPagerDesktopModelTest::
    emitsCurrentIndexChangeForActiveDesktopUpdates() {
  TabPagerDesktopModel model;
  const QList<TabPagerDesktop> desktops = {
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  };
  model.setDesktopRows(desktopRows(desktops, desktopId("a")));
  QSignalSpy currentSpy(&model, &TabPagerDesktopModel::currentIndexChanged);
  QSignalSpy dataSpy(&model, &QAbstractItemModel::dataChanged);

  model.setDesktopRows(desktopRows(desktops, desktopId("b")));

  QCOMPARE(model.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, 0);
  QCOMPARE(emission.lastRow, 1);
  QCOMPARE(emission.roles, QList<int>{role(TabPagerDesktopRowRole::Active)});
}

QTEST_MAIN(TabPagerDesktopModelTest)

#include "tabpagerdesktopmodel_test.moc"
