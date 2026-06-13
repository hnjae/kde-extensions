// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackendtesthelpers.h"
#include "tabpagerdesktopcontroller.h"
#include "tabpagertesthelpers.h"

#include <QSignalSpy>
#include <QTest>

#include <memory>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::FakeDesktopSource;
using TabPagerTest::FakeNavigationSettingsSource;

constexpr int wheelStepDelta = 120;
constexpr int halfWheelStepDelta = wheelStepDelta / 2;

void expectActivationResult(TabPagerActivationResult actual,
                            TabPagerActivationResult expected) {
  QCOMPARE(static_cast<int>(actual), static_cast<int>(expected));
}

struct ControllerFixture {
private:
  struct AdoptSources {};

public:
  explicit ControllerFixture(const QList<TabPagerDesktop> &desktops,
                             const TabPagerDesktopId &currentDesktop = {},
                             bool navigationWrappingAround = false)
      : ControllerFixture(
            AdoptSources{},
            std::make_unique<FakeDesktopSource>(desktops, currentDesktop),
            std::make_unique<FakeNavigationSettingsSource>(
                navigationWrappingAround)) {}

  FakeDesktopSource *source = nullptr;
  FakeNavigationSettingsSource *settings = nullptr;
  TabPagerDesktopModel model;
  TabPagerDesktopController controller;

private:
  explicit ControllerFixture(
      [[maybe_unused]] AdoptSources adoptSources,
      std::unique_ptr<FakeDesktopSource> fakeSource,
      std::unique_ptr<FakeNavigationSettingsSource> fakeSettings)
      : source(fakeSource.get()), settings(fakeSettings.get()),
        controller(std::move(fakeSource), std::move(fakeSettings), model) {}
};
} // namespace

class TabPagerDesktopControllerTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void synchronizesSourceStateToModelAndNavigation();
  void synchronizesNavigationWrappingWithoutModelReload();
  void activatesDesktopsThroughModelIndexes();
  void activatesRelativeNavigationTargets();
  void reportsActivationResults();
  void reportsNavigationNoOpResults();
};

void TabPagerDesktopControllerTest::
    synchronizesSourceStateToModelAndNavigation() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
  });
  QSignalSpy countSpy(&fixture.model, &TabPagerDesktopModel::countChanged);
  QSignalSpy currentSpy(&fixture.model,
                        &TabPagerDesktopModel::currentIndexChanged);
  QSignalSpy wrappingSpy(
      &fixture.controller,
      &TabPagerDesktopController::navigationWrappingAroundChanged);

  fixture.source->setSourceState(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"));
  fixture.settings->setNavigationWrappingAround(true);

  QCOMPARE(fixture.model.count(), 2);
  QCOMPARE(fixture.model.currentIndex(), 1);
  QCOMPARE(fixture.controller.navigationWrappingAround(), true);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerDesktopControllerTest::
    synchronizesNavigationWrappingWithoutModelReload() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
  });
  QSignalSpy countSpy(&fixture.model, &TabPagerDesktopModel::countChanged);
  QSignalSpy currentSpy(&fixture.model,
                        &TabPagerDesktopModel::currentIndexChanged);
  QSignalSpy wrappingSpy(
      &fixture.controller,
      &TabPagerDesktopController::navigationWrappingAroundChanged);

  fixture.settings->setNavigationWrappingAround(true);

  QCOMPARE(fixture.model.count(), 1);
  QCOMPARE(fixture.model.currentIndex(), -1);
  QCOMPARE(fixture.controller.navigationWrappingAround(), true);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(currentSpy.count(), 0);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerDesktopControllerTest::activatesDesktopsThroughModelIndexes() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });

  fixture.controller.activate(-1);
  fixture.controller.activate(2);
  fixture.controller.activate(1);

  QCOMPARE(fixture.source->activatedDesktops(),
           QList<TabPagerDesktopId>{desktopId("b")});
}

void TabPagerDesktopControllerTest::activatesRelativeNavigationTargets() {
  ControllerFixture fixture(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
          defaultDesktop("c", 3),
      },
      desktopId("b"), true);

  fixture.controller.activateNext();
  fixture.controller.activatePrevious();

  const QList<TabPagerDesktopId> expected = {desktopId("c"), desktopId("a")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerDesktopControllerTest::reportsActivationResults() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });

  expectActivationResult(fixture.controller.activateWithResult(-1),
                         TabPagerActivationResult::InvalidIndex);
  expectActivationResult(fixture.controller.activateWithResult(2),
                         TabPagerActivationResult::InvalidIndex);
  expectActivationResult(fixture.controller.activateWithResult(1),
                         TabPagerActivationResult::ActivationRequested);

  QCOMPARE(fixture.source->activatedDesktops(),
           QList<TabPagerDesktopId>{desktopId("b")});
}

void TabPagerDesktopControllerTest::reportsNavigationNoOpResults() {
  ControllerFixture missingCurrentDesktop({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  expectActivationResult(
      missingCurrentDesktop.controller.activateNextWithResult(),
      TabPagerActivationResult::NoCurrentDesktop);

  ControllerFixture stoppedAtEdge(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"), false);
  expectActivationResult(stoppedAtEdge.controller.activatePreviousWithResult(),
                         TabPagerActivationResult::StoppedAtEdge);

  ControllerFixture wheelNavigation(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("b"), false);
  expectActivationResult(
      wheelNavigation.controller.activateByWheelDeltaWithResult(
          halfWheelStepDelta),
      TabPagerActivationResult::NoWheelStep);
  expectActivationResult(
      wheelNavigation.controller.activateByWheelDeltaWithResult(
          halfWheelStepDelta),
      TabPagerActivationResult::ActivationRequested);

  QCOMPARE(wheelNavigation.source->activatedDesktops(),
           QList<TabPagerDesktopId>{desktopId("a")});
}

QTEST_MAIN(TabPagerDesktopControllerTest)

#include "tabpagerdesktopcontroller_test.moc"
