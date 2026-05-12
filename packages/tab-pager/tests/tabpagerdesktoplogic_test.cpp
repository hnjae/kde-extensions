// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoplogic.h"

#include <QTest>

class TabPagerDesktopLogicTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void formatsDesktopLabel_data();
  void formatsDesktopLabel();
  void resolvesNavigationTarget_data();
  void resolvesNavigationTarget();
  void consumesWheelDelta_data();
  void consumesWheelDelta();
};

void TabPagerDesktopLogicTest::formatsDesktopLabel_data() {
  constexpr int prefixOnlyDesktopNumber = 5;
  constexpr int laterDesktopNumber = 12;

  QTest::addColumn<int>("number");
  QTest::addColumn<QString>("name");
  QTest::addColumn<QString>("expected");

  QTest::newRow("default first")
      << 1 << QStringLiteral("Desktop 1") << QStringLiteral("1");
  QTest::newRow("default later")
      << laterDesktopNumber << QStringLiteral("Desktop 12")
      << QStringLiteral("12");
  QTest::newRow("custom") << 2 << QStringLiteral("Work")
                          << QStringLiteral("Work");
  QTest::newRow("empty") << 3 << QString() << QStringLiteral("3");
  QTest::newRow("prefix only")
      << prefixOnlyDesktopNumber << QStringLiteral("Desktop 5x")
      << QStringLiteral("Desktop 5x");
  QTest::newRow("number mismatch")
      << 4 << QStringLiteral("Desktop 5") << QStringLiteral("Desktop 5");
}

void TabPagerDesktopLogicTest::formatsDesktopLabel() {
  QFETCH(int, number);
  QFETCH(QString, name);
  QFETCH(QString, expected);

  QCOMPARE(TabPagerDesktopLogic::labelForDesktop(number, name), expected);
}

void TabPagerDesktopLogicTest::resolvesNavigationTarget_data() {
  constexpr int multiDesktopOffset = 5;

  QTest::addColumn<int>("currentIndex");
  QTest::addColumn<int>("desktopCount");
  QTest::addColumn<int>("offset");
  QTest::addColumn<bool>("wrappingAround");
  QTest::addColumn<int>("expected");

  QTest::newRow("empty") << 0 << 0 << 1 << false << -1;
  QTest::newRow("invalid count") << 0 << -1 << 1 << true << -1;
  QTest::newRow("missing current") << -1 << 3 << 1 << true << -1;
  QTest::newRow("past current") << 3 << 3 << -1 << true << -1;
  QTest::newRow("next") << 1 << 3 << 1 << false << 2;
  QTest::newRow("previous") << 1 << 3 << -1 << false << 0;
  QTest::newRow("stop before first") << 0 << 3 << -1 << false << -1;
  QTest::newRow("stop after last") << 2 << 3 << 1 << false << -1;
  QTest::newRow("wrap before first") << 0 << 3 << -1 << true << 2;
  QTest::newRow("wrap after last") << 2 << 3 << 1 << true << 0;
  QTest::newRow("wrap forward multiple")
      << 1 << 3 << multiDesktopOffset << true << 0;
  QTest::newRow("wrap backward multiple")
      << 1 << 3 << -multiDesktopOffset << true << 2;
  QTest::newRow("wrap exact cycle") << 1 << 3 << 3 << true << 1;
}

void TabPagerDesktopLogicTest::resolvesNavigationTarget() {
  QFETCH(int, currentIndex);
  QFETCH(int, desktopCount);
  QFETCH(int, offset);
  QFETCH(bool, wrappingAround);
  QFETCH(int, expected);

  QCOMPARE(TabPagerDesktopLogic::targetIndexForOffset(
               TabPagerDesktopLogic::NavigationTargetRequest{
                   .currentIndex = currentIndex,
                   .desktopCount = desktopCount,
                   .offset = offset,
                   .wrappingAround = wrappingAround,
               }),
           expected);
}

void TabPagerDesktopLogicTest::consumesWheelDelta_data() {
  constexpr int wheelStepDelta = 120;
  constexpr int nearlyOneWheelStepDelta = wheelStepDelta - 1;
  constexpr int extraWheelDelta = 10;
  constexpr int multipleWheelStepDelta = (wheelStepDelta * 2) + extraWheelDelta;
  constexpr int halfWheelStepDelta = wheelStepDelta / 2;
  constexpr int quarterWheelStepDelta = halfWheelStepDelta / 2;

  QTest::addColumn<int>("pendingDelta");
  QTest::addColumn<int>("delta");
  QTest::addColumn<int>("expectedRemainingDelta");
  QTest::addColumn<int>("expectedSteps");

  QTest::newRow("keeps positive remainder")
      << 0 << nearlyOneWheelStepDelta << nearlyOneWheelStepDelta << 0;
  QTest::newRow("completes positive step")
      << nearlyOneWheelStepDelta << 1 << 0 << 1;
  QTest::newRow("completes negative step")
      << -nearlyOneWheelStepDelta << -1 << 0 << -1;
  QTest::newRow("consumes multiple positive steps")
      << 0 << multipleWheelStepDelta << extraWheelDelta << 2;
  QTest::newRow("consumes multiple negative steps")
      << 0 << -multipleWheelStepDelta << -extraWheelDelta << -2;
  QTest::newRow("combines opposite directions")
      << halfWheelStepDelta << -quarterWheelStepDelta << quarterWheelStepDelta
      << 0;
}

void TabPagerDesktopLogicTest::consumesWheelDelta() {
  QFETCH(int, pendingDelta);
  QFETCH(int, delta);
  QFETCH(int, expectedRemainingDelta);
  QFETCH(int, expectedSteps);

  const TabPagerDesktopLogic::WheelDeltaResult result =
      TabPagerDesktopLogic::consumeWheelDelta(pendingDelta, delta);

  QCOMPARE(result.remainingDelta, expectedRemainingDelta);
  QCOMPARE(result.steps, expectedSteps);
}

QTEST_MAIN(TabPagerDesktopLogicTest)

#include "tabpagerdesktoplogic_test.moc"
