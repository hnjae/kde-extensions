// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoplogic.h"

#include <QTest>

class TabPagerDesktopLogicTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void formatsDesktopLabel_data();
  void formatsDesktopLabel();
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

QTEST_MAIN(TabPagerDesktopLogicTest)

#include "tabpagerdesktoplogic_test.moc"
