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

QTEST_MAIN(TabPagerDesktopLogicTest)

#include "tabpagerdesktoplogic_test.moc"
