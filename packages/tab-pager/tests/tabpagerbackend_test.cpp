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
using TabPagerTest::invalidDesktop;
using TabPagerTest::namedDesktop;
using TabPagerTest::role;
using TabPagerTest::takeDataChangedEmission;
using TabPagerTest::unnamedDesktop;

constexpr int wheelStepDelta = 120;
constexpr int halfWheelStepDelta = wheelStepDelta / 2;
constexpr int almostHalfWheelStepDelta = halfWheelStepDelta - 1;

[[nodiscard]] TabPagerDesktopModel &desktopModel(TabPagerBackend &backend) {
  auto *model = qobject_cast<TabPagerDesktopModel *>(backend.model());
  Q_ASSERT(model != nullptr);
  return *model;
}
} // namespace

class TabPagerBackendTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesExplicitModel();
  void keepsModelSeparateFromFacade();
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
  void updatesDesktopAndNavigationStateTogether();
  void activatesDesktopByIndex();
  void reportsActivationResultByIndex();
  void reportsRelativeActivationNoOps();
  void reportsWheelActivationNoOps();
  void ignoresActivationForInvalidDesktopId();
  void ignoresRelativeActivationWithoutCurrentDesktop();
  void stopsAtEdgesWithoutWrapping();
  void activatesNextAndPreviousWithoutWrapping();
  void activatesNextAndPreviousWithWrapping();
  void activatesFromAccumulatedWheelDelta();
  void activatesFromMultipleWheelSteps();
};

void TabPagerBackendTest::exposesExplicitModel() {
  BackendFixture fixture({});
  TabPagerBackend &backend = fixture.backend;

  QVERIFY(backend.model() != nullptr);
  QCOMPARE(backend.property("model").value<QObject *>(),
           static_cast<QObject *>(backend.model()));
}

void TabPagerBackendTest::keepsModelSeparateFromFacade() {
  BackendFixture fixture({});
  TabPagerBackend &backend = fixture.backend;

  QVERIFY(backend.model() != nullptr);
  QVERIFY(qobject_cast<QAbstractItemModel *>(&backend) == nullptr);
  QVERIFY(backend.model() != qobject_cast<QAbstractItemModel *>(&backend));
}

void TabPagerBackendTest::exposesModelState() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          namedDesktop("b", "Work"),
          unnamedDesktop("c"),
      },
      desktopId("b"), true);
  TabPagerBackend &backend = fixture.backend;
  const TabPagerDesktopModel &model = desktopModel(backend);

  QCOMPARE(backend.count(), 3);
  QCOMPARE(model.rowCount(), 3);
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
  TabPagerBackend &backend = fixture.backend;
  const TabPagerDesktopModel &model = desktopModel(backend);

  const QModelIndex first = model.index(0);
  QCOMPARE(model.data(first, role(TabPagerDesktopRowRole::DesktopId)),
           desktopId("a").toVariant());
  QCOMPARE(model.data(first, role(TabPagerDesktopRowRole::Name)),
           QVariant(QStringLiteral("Desktop 1")));
  QCOMPARE(model.data(first, role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("1")));
  QCOMPARE(model.data(first, role(TabPagerDesktopRowRole::Number)),
           QVariant(1));
  QCOMPARE(model.data(first, role(TabPagerDesktopRowRole::Active)),
           QVariant(false));

  const QModelIndex second = model.index(1);
  QCOMPARE(model.data(second, role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Work")));
  QCOMPARE(model.data(second, role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerBackendTest::exposesRoleNames() {
  BackendFixture fixture({});
  const TabPagerDesktopModel &model = desktopModel(fixture.backend);
  const QHash<int, QByteArray> roles = model.roleNames();

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
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&model, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      defaultDesktop("a", 1),
      namedDesktop("b", "Chat"),
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(resetSpy.count(), 1);
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::resetsWhenDesktopIdentityChanges() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"));
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&model, &QAbstractItemModel::modelReset);

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
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&model, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      defaultDesktop("a", 1),
      namedDesktop("b", "Chat"),
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 0);
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Label)),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::emitsChangedRolesForUpdatedDesktopRows() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"));
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy dataSpy(&model, &QAbstractItemModel::dataChanged);

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
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&model, &QAbstractItemModel::dataChanged);

  fixture.source->setDesktopState(desktops, desktopId("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, 0);
  QCOMPARE(emission.lastRow, 1);
  QCOMPARE(emission.roles, QList<int>{role(TabPagerDesktopRowRole::Active)});
  QCOMPARE(model.data(model.index(0), role(TabPagerDesktopRowRole::Active)),
           QVariant(false));
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Active)),
           QVariant(true));
}

void TabPagerBackendTest::tracksCurrentDesktop() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  TabPagerDesktopModel &model = desktopModel(fixture.backend);
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&model, &QAbstractItemModel::dataChanged);

  fixture.source->setCurrentDesktop(desktopId("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const DataChangedEmission emission = takeDataChangedEmission(dataSpy);
  QCOMPARE(emission.firstRow, 1);
  QCOMPARE(emission.lastRow, 1);
  QCOMPARE(emission.roles, QList<int>{role(TabPagerDesktopRowRole::Active)});
  QCOMPARE(model.data(model.index(1), role(TabPagerDesktopRowRole::Active)),
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

void TabPagerBackendTest::updatesDesktopAndNavigationStateTogether() {
  BackendFixture fixture({defaultDesktop("a", 1)}, desktopId("a"), false);
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy wrappingSpy(&fixture.backend,
                         &TabPagerBackend::navigationWrappingAroundChanged);

  fixture.source->setSourceState(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"), true);

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(fixture.backend.navigationWrappingAround(), true);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(currentSpy.count(), 1);
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
           QList<TabPagerDesktopId>{desktopId("b")});
}

void TabPagerBackendTest::reportsActivationResultByIndex() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  QSignalSpy activationSpy(&fixture.backend,
                           SIGNAL(activationFinished(QString)));
  QVERIFY(activationSpy.isValid());

  fixture.backend.activate(-1);
  fixture.backend.activate(1);

  QCOMPARE(activationSpy.count(), 2);
  QCOMPARE(activationSpy.at(0).at(0).toString(),
           QStringLiteral("InvalidIndex"));
  QCOMPARE(activationSpy.at(1).at(0).toString(),
           QStringLiteral("ActivationRequested"));
}

void TabPagerBackendTest::reportsRelativeActivationNoOps() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      {}, false);
  QSignalSpy activationSpy(&fixture.backend,
                           SIGNAL(activationFinished(QString)));
  QVERIFY(activationSpy.isValid());

  fixture.backend.activateNext();
  fixture.source->setCurrentDesktop(desktopId("a"));
  fixture.backend.activatePrevious();

  QCOMPARE(activationSpy.count(), 2);
  QCOMPARE(activationSpy.at(0).at(0).toString(),
           QStringLiteral("NoCurrentDesktop"));
  QCOMPARE(activationSpy.at(1).at(0).toString(),
           QStringLiteral("StoppedAtEdge"));
}

void TabPagerBackendTest::reportsWheelActivationNoOps() {
  BackendFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"), false);
  QSignalSpy activationSpy(&fixture.backend,
                           SIGNAL(activationFinished(QString)));
  QVERIFY(activationSpy.isValid());

  fixture.backend.activateByWheelDelta(halfWheelStepDelta);
  fixture.backend.activateByWheelDelta(wheelStepDelta);

  QCOMPARE(activationSpy.count(), 2);
  QCOMPARE(activationSpy.at(0).at(0).toString(), QStringLiteral("NoWheelStep"));
  QCOMPARE(activationSpy.at(1).at(0).toString(),
           QStringLiteral("StoppedAtEdge"));
}

void TabPagerBackendTest::ignoresActivationForInvalidDesktopId() {
  BackendFixture fixture({
      invalidDesktop(QStringLiteral("Broken")),
  });

  QCOMPARE(fixture.backend.count(), 0);
  fixture.backend.activate(0);

  const QList<TabPagerDesktopId> expected;
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::ignoresRelativeActivationWithoutCurrentDesktop() {
  BackendFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });

  fixture.backend.activateNext();
  fixture.backend.activatePrevious();

  const QList<TabPagerDesktopId> expected;
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

  const QList<TabPagerDesktopId> expected;
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

  const QList<TabPagerDesktopId> expected = {desktopId("c"), desktopId("a")};
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

  const QList<TabPagerDesktopId> expected = {desktopId("a"), desktopId("c")};
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

  const QList<TabPagerDesktopId> expected = {desktopId("a"), desktopId("c")};
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

  const QList<TabPagerDesktopId> expected = {desktopId("c"), desktopId("a")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

QTEST_MAIN(TabPagerBackendTest)

#include "tabpagerbackend_test.moc"
