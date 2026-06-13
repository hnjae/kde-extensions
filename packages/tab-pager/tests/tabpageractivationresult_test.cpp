// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpageractivationresult.h"

#include <QTest>

class TabPagerActivationResultTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void namesActivationResults_data();
  void namesActivationResults();
};

void TabPagerActivationResultTest::namesActivationResults_data() {
  QTest::addColumn<TabPagerActivationResult>("result");
  QTest::addColumn<QString>("expectedName");

  QTest::newRow("activation requested")
      << TabPagerActivationResult::ActivationRequested
      << QStringLiteral("ActivationRequested");
  QTest::newRow("invalid index") << TabPagerActivationResult::InvalidIndex
                                 << QStringLiteral("InvalidIndex");
  QTest::newRow("invalid desktop id")
      << TabPagerActivationResult::InvalidDesktopId
      << QStringLiteral("InvalidDesktopId");
  QTest::newRow("no current desktop")
      << TabPagerActivationResult::NoCurrentDesktop
      << QStringLiteral("NoCurrentDesktop");
  QTest::newRow("stopped at edge") << TabPagerActivationResult::StoppedAtEdge
                                   << QStringLiteral("StoppedAtEdge");
  QTest::newRow("no wheel step")
      << TabPagerActivationResult::NoWheelStep << QStringLiteral("NoWheelStep");
}

void TabPagerActivationResultTest::namesActivationResults() {
  QFETCH(TabPagerActivationResult, result);
  QFETCH(QString, expectedName);

  QCOMPARE(tabPagerActivationResultName(result), expectedName);
}

QTEST_MAIN(TabPagerActivationResultTest)

#include "tabpageractivationresult_test.moc"
