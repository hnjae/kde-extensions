// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerwheelnavigation.h"

#include <QTest>

namespace {
void expectWheelResult(const TabPagerWheelNavigationResult &actual,
                       TabPagerWheelNavigationResultType expectedType,
                       int expectedOffset = 0) {
  QCOMPARE(actual.type, expectedType);
  QCOMPARE(actual.offset, expectedOffset);
}
} // namespace

class TabPagerWheelNavigationTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void consumesDelta_data();
  void consumesDelta();
};

void TabPagerWheelNavigationTest::consumesDelta_data() {
  constexpr int wheelStepDelta = 120;
  constexpr int nearlyOneWheelStepDelta = wheelStepDelta - 1;
  constexpr int extraWheelDelta = 10;
  constexpr int multipleWheelStepDelta = (wheelStepDelta * 2) + extraWheelDelta;
  constexpr int halfWheelStepDelta = wheelStepDelta / 2;
  constexpr int quarterWheelStepDelta = halfWheelStepDelta / 2;

  QTest::addColumn<int>("firstDelta");
  QTest::addColumn<int>("secondDelta");
  QTest::addColumn<TabPagerWheelNavigationResultType>("expectedFirstType");
  QTest::addColumn<int>("expectedFirstOffset");
  QTest::addColumn<TabPagerWheelNavigationResultType>("expectedSecondType");
  QTest::addColumn<int>("expectedSecondOffset");

  QTest::newRow("keeps positive remainder")
      << nearlyOneWheelStepDelta << 0
      << TabPagerWheelNavigationResultType::NoWheelStep << 0
      << TabPagerWheelNavigationResultType::NoWheelStep << 0;
  QTest::newRow("scroll up maps to previous offset")
      << nearlyOneWheelStepDelta << 1
      << TabPagerWheelNavigationResultType::NoWheelStep << 0
      << TabPagerWheelNavigationResultType::Offset << -1;
  QTest::newRow("scroll down maps to next offset")
      << -nearlyOneWheelStepDelta << -1
      << TabPagerWheelNavigationResultType::NoWheelStep << 0
      << TabPagerWheelNavigationResultType::Offset << 1;
  QTest::newRow("consumes multiple positive steps")
      << multipleWheelStepDelta << 0
      << TabPagerWheelNavigationResultType::Offset << -2
      << TabPagerWheelNavigationResultType::NoWheelStep << 0;
  QTest::newRow("consumes multiple negative steps")
      << -multipleWheelStepDelta << 0
      << TabPagerWheelNavigationResultType::Offset << 2
      << TabPagerWheelNavigationResultType::NoWheelStep << 0;
  QTest::newRow("combines opposite directions")
      << halfWheelStepDelta << -quarterWheelStepDelta
      << TabPagerWheelNavigationResultType::NoWheelStep << 0
      << TabPagerWheelNavigationResultType::NoWheelStep << 0;
}

void TabPagerWheelNavigationTest::consumesDelta() {
  QFETCH(int, firstDelta);
  QFETCH(int, secondDelta);
  QFETCH(TabPagerWheelNavigationResultType, expectedFirstType);
  QFETCH(int, expectedFirstOffset);
  QFETCH(TabPagerWheelNavigationResultType, expectedSecondType);
  QFETCH(int, expectedSecondOffset);

  TabPagerWheelNavigation navigation;

  expectWheelResult(navigation.consumeDelta(firstDelta), expectedFirstType,
                    expectedFirstOffset);

  expectWheelResult(navigation.consumeDelta(secondDelta), expectedSecondType,
                    expectedSecondOffset);
}

QTEST_MAIN(TabPagerWheelNavigationTest)

#include "tabpagerwheelnavigation_test.moc"
