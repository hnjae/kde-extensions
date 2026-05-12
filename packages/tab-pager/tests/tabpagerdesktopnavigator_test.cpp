// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopnavigator.h"

#include <QTest>

#include <optional>

namespace {
void expectNavigationTarget(const std::optional<int> &actual,
                            const std::optional<int> &expected) {
  QCOMPARE(actual.has_value(), expected.has_value());
  if (expected.has_value()) {
    QCOMPARE(*actual, *expected);
  }
}
} // namespace

class TabPagerDesktopNavigatorTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void resolvesNavigationTarget_data();
  void resolvesNavigationTarget();
  void accumulatesWheelDelta_data();
  void accumulatesWheelDelta();
};

void TabPagerDesktopNavigatorTest::resolvesNavigationTarget_data() {
  constexpr int multiDesktopOffset = 5;

  QTest::addColumn<int>("currentIndex");
  QTest::addColumn<int>("desktopCount");
  QTest::addColumn<int>("offset");
  QTest::addColumn<bool>("wrappingAround");
  QTest::addColumn<std::optional<int>>("expected");

  QTest::newRow("empty") << 0 << 0 << 1 << false << std::optional<int>{};
  QTest::newRow("invalid count")
      << 0 << -1 << 1 << true << std::optional<int>{};
  QTest::newRow("missing current")
      << -1 << 3 << 1 << true << std::optional<int>{};
  QTest::newRow("past current") << 3 << 3 << -1 << true << std::optional<int>{};
  QTest::newRow("next") << 1 << 3 << 1 << false << std::optional<int>{2};
  QTest::newRow("previous") << 1 << 3 << -1 << false << std::optional<int>{0};
  QTest::newRow("stop before first")
      << 0 << 3 << -1 << false << std::optional<int>{};
  QTest::newRow("stop after last")
      << 2 << 3 << 1 << false << std::optional<int>{};
  QTest::newRow("wrap before first")
      << 0 << 3 << -1 << true << std::optional<int>{2};
  QTest::newRow("wrap after last")
      << 2 << 3 << 1 << true << std::optional<int>{0};
  QTest::newRow("wrap forward multiple")
      << 1 << 3 << multiDesktopOffset << true << std::optional<int>{0};
  QTest::newRow("wrap backward multiple")
      << 1 << 3 << -multiDesktopOffset << true << std::optional<int>{2};
  QTest::newRow("wrap exact cycle")
      << 1 << 3 << 3 << true << std::optional<int>{1};
}

void TabPagerDesktopNavigatorTest::resolvesNavigationTarget() {
  QFETCH(int, currentIndex);
  QFETCH(int, desktopCount);
  QFETCH(int, offset);
  QFETCH(bool, wrappingAround);
  QFETCH(std::optional<int>, expected);

  TabPagerDesktopNavigator navigator;
  navigator.setNavigationWrappingAround(wrappingAround);
  const TabPagerDesktopNavigationContext context{
      .currentIndex = currentIndex,
      .desktopCount = desktopCount,
  };

  expectNavigationTarget(navigator.targetIndexForOffset(context, offset),
                         expected);
}

void TabPagerDesktopNavigatorTest::accumulatesWheelDelta_data() {
  constexpr int wheelStepDelta = 120;
  constexpr int nearlyOneWheelStepDelta = wheelStepDelta - 1;
  constexpr int extraWheelDelta = 10;
  constexpr int multipleWheelStepDelta = (wheelStepDelta * 2) + extraWheelDelta;
  constexpr int halfWheelStepDelta = wheelStepDelta / 2;
  constexpr int quarterWheelStepDelta = halfWheelStepDelta / 2;

  QTest::addColumn<int>("firstDelta");
  QTest::addColumn<int>("secondDelta");
  QTest::addColumn<std::optional<int>>("expectedFirstTarget");
  QTest::addColumn<std::optional<int>>("expectedSecondTarget");

  QTest::newRow("keeps positive remainder")
      << nearlyOneWheelStepDelta << 0 << std::optional<int>{}
      << std::optional<int>{};
  QTest::newRow("completes positive step")
      << nearlyOneWheelStepDelta << 1 << std::optional<int>{}
      << std::optional<int>{0};
  QTest::newRow("completes negative step")
      << -nearlyOneWheelStepDelta << -1 << std::optional<int>{}
      << std::optional<int>{2};
  QTest::newRow("consumes multiple positive steps")
      << multipleWheelStepDelta << 0 << std::optional<int>{2}
      << std::optional<int>{};
  QTest::newRow("consumes multiple negative steps")
      << -multipleWheelStepDelta << 0 << std::optional<int>{0}
      << std::optional<int>{};
  QTest::newRow("combines opposite directions")
      << halfWheelStepDelta << -quarterWheelStepDelta << std::optional<int>{}
      << std::optional<int>{};
}

void TabPagerDesktopNavigatorTest::accumulatesWheelDelta() {
  QFETCH(int, firstDelta);
  QFETCH(int, secondDelta);
  QFETCH(std::optional<int>, expectedFirstTarget);
  QFETCH(std::optional<int>, expectedSecondTarget);

  TabPagerDesktopNavigator navigator;
  navigator.setNavigationWrappingAround(true);
  constexpr TabPagerDesktopNavigationContext context{
      .currentIndex = 1,
      .desktopCount = 3,
  };

  expectNavigationTarget(
      navigator.targetIndexForWheelDelta(context, firstDelta),
      expectedFirstTarget);

  expectNavigationTarget(
      navigator.targetIndexForWheelDelta(context, secondDelta),
      expectedSecondTarget);
}

QTEST_MAIN(TabPagerDesktopNavigatorTest)

#include "tabpagerdesktopnavigator_test.moc"
