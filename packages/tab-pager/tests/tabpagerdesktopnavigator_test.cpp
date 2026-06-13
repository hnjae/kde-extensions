// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopnavigator.h"

#include <QTest>

namespace {
void expectNavigationResult(const TabPagerDesktopNavigationResult &actual,
                            TabPagerDesktopNavigationResultType expectedType,
                            int expectedTargetIndex = -1) {
  QCOMPARE(actual.type, expectedType);
  QCOMPARE(actual.targetIndex, expectedTargetIndex);
}
} // namespace

class TabPagerDesktopNavigatorTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void resolvesNavigationTarget_data();
  void resolvesNavigationTarget();
};

void TabPagerDesktopNavigatorTest::resolvesNavigationTarget_data() {
  constexpr int multiDesktopOffset = 5;

  QTest::addColumn<int>("currentIndex");
  QTest::addColumn<int>("desktopCount");
  QTest::addColumn<int>("offset");
  QTest::addColumn<bool>("wrappingAround");
  QTest::addColumn<TabPagerDesktopNavigationResultType>("expectedType");
  QTest::addColumn<int>("expectedTargetIndex");

  QTest::newRow("empty")
      << 0 << 0 << 1 << false
      << TabPagerDesktopNavigationResultType::NoCurrentDesktop << -1;
  QTest::newRow("invalid count")
      << 0 << -1 << 1 << true
      << TabPagerDesktopNavigationResultType::NoCurrentDesktop << -1;
  QTest::newRow("missing current")
      << -1 << 3 << 1 << true
      << TabPagerDesktopNavigationResultType::NoCurrentDesktop << -1;
  QTest::newRow("past current")
      << 3 << 3 << -1 << true
      << TabPagerDesktopNavigationResultType::NoCurrentDesktop << -1;
  QTest::newRow("next") << 1 << 3 << 1 << false
                        << TabPagerDesktopNavigationResultType::Target << 2;
  QTest::newRow("previous") << 1 << 3 << -1 << false
                            << TabPagerDesktopNavigationResultType::Target << 0;
  QTest::newRow("stop before first")
      << 0 << 3 << -1 << false
      << TabPagerDesktopNavigationResultType::StoppedAtEdge << -1;
  QTest::newRow("stop after last")
      << 2 << 3 << 1 << false
      << TabPagerDesktopNavigationResultType::StoppedAtEdge << -1;
  QTest::newRow("wrap before first")
      << 0 << 3 << -1 << true << TabPagerDesktopNavigationResultType::Target
      << 2;
  QTest::newRow("wrap after last")
      << 2 << 3 << 1 << true << TabPagerDesktopNavigationResultType::Target
      << 0;
  QTest::newRow("wrap forward multiple")
      << 1 << 3 << multiDesktopOffset << true
      << TabPagerDesktopNavigationResultType::Target << 0;
  QTest::newRow("wrap backward multiple")
      << 1 << 3 << -multiDesktopOffset << true
      << TabPagerDesktopNavigationResultType::Target << 2;
  QTest::newRow("wrap exact cycle")
      << 1 << 3 << 3 << true << TabPagerDesktopNavigationResultType::Target
      << 1;
}

void TabPagerDesktopNavigatorTest::resolvesNavigationTarget() {
  QFETCH(int, currentIndex);
  QFETCH(int, desktopCount);
  QFETCH(int, offset);
  QFETCH(bool, wrappingAround);
  QFETCH(TabPagerDesktopNavigationResultType, expectedType);
  QFETCH(int, expectedTargetIndex);

  TabPagerDesktopNavigator navigator;
  navigator.setNavigationWrappingAround(wrappingAround);
  const TabPagerDesktopNavigationContext context{
      .currentIndex = currentIndex,
      .desktopCount = desktopCount,
  };

  expectNavigationResult(navigator.targetForOffset(context, offset),
                         expectedType, expectedTargetIndex);
}

QTEST_MAIN(TabPagerDesktopNavigatorTest)

#include "tabpagerdesktopnavigator_test.moc"
