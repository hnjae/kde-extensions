// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"
#include "tabpagerbackendtesthelpers.h"
#include "tabpagertesthelpers.h"

#include <QSignalSpy>
#include <QTest>

namespace {
using TabPagerTest::BackendFixture;
using TabPagerTest::DataChangedEmission;
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::takeDataChangedEmission;
using TabPagerTest::unnamedDesktop;

constexpr int wheelStepDelta = 120;
constexpr int halfWheelStepDelta = wheelStepDelta / 2;
constexpr int almostHalfWheelStepDelta = halfWheelStepDelta - 1;
} // namespace

class TabPagerBackendTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesModelState();
  void exposesModelData();
  void exposesRoleNames();
  void updatesWhenDesktopsChange();
  void resetsWhenDesktopIdentityChanges();
  void updatesDesktopRowsWithoutReset();
  void emitsChangedRolesForUpdatedDesktopRows();
  void tracksCurrentDesktopFromDesktopReload();
  void tracksCurrentDesktop();
  void updatesNavigationWrapping();
  void activatesDesktopByIndex();
  void ignoresRelativeActivationWithoutCurrentDesktop();
  void stopsAtEdgesWithoutWrapping();
  void activatesNextAndPreviousWithoutWrapping();
  void activatesNextAndPreviousWithWrapping();
  void activatesFromAccumulatedWheelDelta();
  void activatesFromMultipleWheelSteps();
};

void TabPagerBackendTest::exposesModelState() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
          unnamedDesktop("c"),
      },
      desktopId("b"), true);
  const TabPagerBackend &backend = fixture.backend;

  QCOMPARE(backend.count(), 3);
  QCOMPARE(backend.rowCount(), 3);
  QCOMPARE(backend.currentIndex(), 1);
  QCOMPARE(backend.navigationWrappingAround(), true);
}

void TabPagerBackendTest::exposesModelData() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
          unnamedDesktop("c"),
      },
      desktopId("b"), true);
  const TabPagerBackend &backend = fixture.backend;

  const QModelIndex first = backend.index(0);
  QCOMPARE(backend.data(first, role(TabPagerDesktopRowRole::DesktopId)),
           desktopId("a"));
  QCOMPARE(backend.data(first, role(TabPagerDesktopRowRole::Name)),
           QVariant(QStringLiteral("Desktop 1")));
  QCOMPARE(backend.data(first, role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(backend.data(first, role(TabPagerDesktopRowRole::Number)),
           QVariant(1));
  QCOMPARE(backend.data(first, role(TabPagerDesktopRowRole::Active)),
           QVariant(false));

  const QModelIndex second = backend.index(1);
  QCOMPARE(backend.data(second, role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Work")));
  QCOMPARE(backend.data(second, role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerBackendTest::exposesRoleNames() {
  BackendFixture fixture({});
  const TabPagerBackend &backend = fixture.backend;
  const QHash<int, QByteArray> roles = backend.roleNames();

  const QHash<int, QByteArray> expected = {
      {role(TabPagerDesktopRowRole::DesktopId), "desktopId"},
      {role(TabPagerDesktopRowRole::Name), "name"},
      {role(TabPagerDesktopRowRole::Label), "label"},
      {role(TabPagerDesktopRowRole::Number), "number"},
      {role(TabPagerDesktopRowRole::Active), "active"},
  };
  QCOMPARE(roles, expected);
}

void TabPagerBackendTest::updatesWhenDesktopsChange() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
  });
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      defaultDesktop("a", 1),
      namedDesktop("b", "Chat"),
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(resetSpy.count(), 1);
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::resetsWhenDesktopIdentityChanges() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"));
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      defaultDesktop("b", 1),
      defaultDesktop("a", 2),
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 1);
}

void TabPagerBackendTest::updatesDesktopRowsWithoutReset() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"));
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      defaultDesktop("a", 1),
      namedDesktop("b", "Chat"),
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 0);
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::emitsChangedRolesForUpdatedDesktopRows() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"));
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setDesktops({
      defaultDesktop("a", 1),
      namedDesktop("b", "Chat"),
  });

  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, 1);
  QCOMPARE(emission.lastRow, 1);
  QCOMPARE(emission.roles, (QList<int>{
                               role(TabPagerDesktopRowRole::Name),
                               role(TabPagerDesktopRowRole::Label),
                           }));
}

void TabPagerBackendTest::tracksCurrentDesktopFromDesktopReload() {
  const QList<TabPagerDesktop> desktops = {
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  };
  BackendFixture fixture(desktops, desktopId("a"));
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setDesktopState(desktops, desktopId("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 2);
  QCOMPARE(fixture.backend.data(fixture.backend.index(0),
                                role(TabPagerDesktopRowRole::Active)),
           QVariant(false));
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerBackendTest::tracksCurrentDesktop() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setCurrentDesktop(desktopId("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, 1);
  QCOMPARE(emission.lastRow, 1);
  QCOMPARE(emission.roles, QList<int>{role(TabPagerDesktopRowRole::Active)});
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerBackendTest::updatesNavigationWrapping() {
  BackendFixture fixture({});
  QSignalSpy wrappingSpy(&fixture.backend,
                         &TabPagerBackend::navigationWrappingAroundChanged);

  fixture.source->setNavigationWrappingAround(true);

  QCOMPARE(fixture.backend.navigationWrappingAround(), true);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerBackendTest::activatesDesktopByIndex() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });

  fixture.backend.activate(-1);
  fixture.backend.activate(2);
  fixture.backend.activate(1);

  QCOMPARE(fixture.source->activatedDesktops(),
           QList<QVariant>{desktopId("b")});
}

void TabPagerBackendTest::ignoresRelativeActivationWithoutCurrentDesktop() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });

  fixture.backend.activateNext();
  fixture.backend.activatePrevious();

  const QList<QVariant> expected;
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::stopsAtEdgesWithoutWrapping() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"), false);

  fixture.backend.activatePrevious();
  fixture.source->setCurrentDesktop(desktopId("b"));
  fixture.backend.activateNext();

  const QList<QVariant> expected;
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesNextAndPreviousWithoutWrapping() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
          defaultDesktop("c", 3),
      },
      desktopId("b"), false);

  fixture.backend.activateNext();
  fixture.backend.activatePrevious();
  fixture.source->setCurrentDesktop(desktopId("c"));
  fixture.backend.activateNext();

  const QList<QVariant> expected = {desktopId("c"), desktopId("a")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesNextAndPreviousWithWrapping() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
          defaultDesktop("c", 3),
      },
      desktopId("c"), true);

  fixture.backend.activateNext();
  fixture.source->setCurrentDesktop(desktopId("a"));
  fixture.backend.activatePrevious();

  const QList<QVariant> expected = {desktopId("a"), desktopId("c")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesFromAccumulatedWheelDelta() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
          defaultDesktop("c", 3),
      },
      desktopId("b"), false);

  fixture.backend.activateByWheelDelta(halfWheelStepDelta);
  fixture.backend.activateByWheelDelta(almostHalfWheelStepDelta);
  fixture.backend.activateByWheelDelta(1);
  fixture.source->setCurrentDesktop(desktopId("b"));
  fixture.backend.activateByWheelDelta(-wheelStepDelta);

  const QList<QVariant> expected = {desktopId("a"), desktopId("c")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesFromMultipleWheelSteps() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
          defaultDesktop("c", 3),
      },
      desktopId("b"), true);

  fixture.backend.activateByWheelDelta(wheelStepDelta * 2);
  fixture.backend.activateByWheelDelta(-wheelStepDelta * 2);

  const QList<QVariant> expected = {desktopId("c"), desktopId("a")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

QTEST_MAIN(TabPagerBackendTest)

#include "tabpagerbackend_test.moc"
