// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackendtesthelpers.h"
#include "tabpagerdesktopcontroller.h"
#include "tabpagerdesktopstatestore.h"
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

void expectActivationSignal(const QSignalSpy &spy, int signalIndex,
                            TabPagerActivationResult expected) {
  QCOMPARE(spy.at(signalIndex).at(0).value<TabPagerActivationResult>(),
           expected);
}

class FakeDesktopStateStore final : public TabPagerDesktopStateStore {
public:
  [[nodiscard]] int count() const override {
    return static_cast<int>(m_desktops.size());
  }

  [[nodiscard]] int currentIndex() const override {
    if (!m_currentDesktop.isValid()) {
      return -1;
    }

    for (int index = 0; index < count(); ++index) {
      if (m_desktops.at(index).id == m_currentDesktop) {
        return index;
      }
    }

    return -1;
  }

  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const override {
    if (index < 0 || index >= m_desktops.size()) {
      return std::nullopt;
    }

    return m_desktops.at(index).id;
  }

  void setDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot) override {
    ++setSnapshotCount;
    m_desktops = snapshot.desktops();
    m_currentDesktop = snapshot.currentDesktop();
  }

  int setSnapshotCount = 0;

private:
  QList<TabPagerDesktop> m_desktops;
  TabPagerDesktopId m_currentDesktop;
};

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
  FakeDesktopStateStore stateStore;
  TabPagerDesktopController controller;

private:
  explicit ControllerFixture(
      [[maybe_unused]] AdoptSources adoptSources,
      std::unique_ptr<FakeDesktopSource> fakeSource,
      std::unique_ptr<FakeNavigationSettingsSource> fakeSettings)
      : source(fakeSource.get()), settings(fakeSettings.get()),
        controller(std::move(fakeSource), std::move(fakeSettings), stateStore) {
  }
};
} // namespace

class TabPagerDesktopControllerTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void synchronizesSourceStateToModelAndNavigation();
  void synchronizesNavigationWrappingWithoutModelReload();
  void forwardsSourceDiagnosticsHealth();
  void activatesDesktopsThroughModelIndexes();
  void activatesRelativeNavigationTargets();
  void reportsActivationResults();
  void reportsNavigationNoOpResults();
  void emitsActivationFinishedResults();
};

void TabPagerDesktopControllerTest::
    synchronizesSourceStateToModelAndNavigation() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
  });
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

  QCOMPARE(fixture.stateStore.count(), 2);
  QCOMPARE(fixture.stateStore.currentIndex(), 1);
  QCOMPARE(fixture.controller.navigationWrappingAround(), true);
  QCOMPARE(fixture.stateStore.setSnapshotCount, 2);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerDesktopControllerTest::
    synchronizesNavigationWrappingWithoutModelReload() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
  });
  QSignalSpy wrappingSpy(
      &fixture.controller,
      &TabPagerDesktopController::navigationWrappingAroundChanged);

  fixture.settings->setNavigationWrappingAround(true);

  QCOMPARE(fixture.stateStore.count(), 1);
  QCOMPARE(fixture.stateStore.currentIndex(), -1);
  QCOMPARE(fixture.controller.navigationWrappingAround(), true);
  QCOMPARE(fixture.stateStore.setSnapshotCount, 1);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerDesktopControllerTest::forwardsSourceDiagnosticsHealth() {
  ControllerFixture fixture({
      defaultDesktop("a", 1),
  });
  QSignalSpy spy(&fixture.controller,
                 &TabPagerDesktopController::sourceDiagnosticsChanged);

  QCOMPARE(fixture.controller.sourceHasDiagnostics(), false);

  fixture.source->setSourceHasDiagnostics(true);

  QCOMPARE(fixture.controller.sourceHasDiagnostics(), true);
  QCOMPARE(spy.count(), 1);

  fixture.source->setSourceHasDiagnostics(true);

  QCOMPARE(spy.count(), 1);
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

void TabPagerDesktopControllerTest::emitsActivationFinishedResults() {
  ControllerFixture indexActivation({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  QSignalSpy indexSpy(&indexActivation.controller,
                      &TabPagerDesktopController::activationFinished);

  indexActivation.controller.activate(-1);
  indexActivation.controller.activate(1);

  QCOMPARE(indexSpy.count(), 2);
  expectActivationSignal(indexSpy, 0, TabPagerActivationResult::InvalidIndex);
  expectActivationSignal(indexSpy, 1,
                         TabPagerActivationResult::ActivationRequested);
  QCOMPARE(indexActivation.source->activatedDesktops(),
           QList<TabPagerDesktopId>{desktopId("b")});

  ControllerFixture missingCurrentDesktop({
      defaultDesktop("a", 1),
      defaultDesktop("b", 2),
  });
  QSignalSpy missingCurrentSpy(&missingCurrentDesktop.controller,
                               &TabPagerDesktopController::activationFinished);

  missingCurrentDesktop.controller.activateNext();

  QCOMPARE(missingCurrentSpy.count(), 1);
  expectActivationSignal(missingCurrentSpy, 0,
                         TabPagerActivationResult::NoCurrentDesktop);

  ControllerFixture stoppedAtEdge(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"), false);
  QSignalSpy stoppedAtEdgeSpy(&stoppedAtEdge.controller,
                              &TabPagerDesktopController::activationFinished);

  stoppedAtEdge.controller.activatePrevious();

  QCOMPARE(stoppedAtEdgeSpy.count(), 1);
  expectActivationSignal(stoppedAtEdgeSpy, 0,
                         TabPagerActivationResult::StoppedAtEdge);

  ControllerFixture wheelNavigation(
      {
          defaultDesktop("a", 1),
          defaultDesktop("b", 2),
      },
      desktopId("a"), false);
  QSignalSpy wheelSpy(&wheelNavigation.controller,
                      &TabPagerDesktopController::activationFinished);

  wheelNavigation.controller.activateByWheelDelta(halfWheelStepDelta);

  QCOMPARE(wheelSpy.count(), 1);
  expectActivationSignal(wheelSpy, 0, TabPagerActivationResult::NoWheelStep);
}

QTEST_MAIN(TabPagerDesktopControllerTest)

#include "tabpagerdesktopcontroller_test.moc"
