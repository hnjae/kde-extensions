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

struct ControllerFixture {
private:
  struct AdoptSource {};

public:
  explicit ControllerFixture(const QList<TabPagerDesktop> &desktops,
                             const TabPagerDesktopId &currentDesktop = {},
                             bool navigationWrappingAround = false)
      : ControllerFixture(AdoptSource{}, std::make_unique<FakeDesktopSource>(
                                             desktops, currentDesktop,
                                             navigationWrappingAround)) {}

  FakeDesktopSource *source = nullptr;
  TabPagerDesktopModel model;
  TabPagerDesktopController controller;

private:
  explicit ControllerFixture([[maybe_unused]] AdoptSource adoptSource,
                             std::unique_ptr<FakeDesktopSource> fakeSource)
      : source(fakeSource.get()), controller(std::move(fakeSource), model) {}
};
} // namespace

class TabPagerDesktopControllerTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void synchronizesSourceStateToModelAndNavigation();
  void activatesDesktopsThroughModelIndexes();
  void activatesRelativeNavigationTargets();
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
      desktopId("b"), true);

  QCOMPARE(fixture.model.count(), 2);
  QCOMPARE(fixture.model.currentIndex(), 1);
  QCOMPARE(fixture.controller.navigationWrappingAround(), true);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(currentSpy.count(), 1);
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

QTEST_MAIN(TabPagerDesktopControllerTest)

#include "tabpagerdesktopcontroller_test.moc"
