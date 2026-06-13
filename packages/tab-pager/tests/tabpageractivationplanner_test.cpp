// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpageractivationplanner.h"

#include <QTest>

class TabPagerActivationPlannerTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void rejectsMissingDesktopId();
  void rejectsInvalidDesktopId();
  void returnsActivationCommandForValidDesktopId();
};

void TabPagerActivationPlannerTest::rejectsMissingDesktopId() {
  const TabPagerActivationPlan plan = tabPagerActivationPlanForIndex({});

  QCOMPARE(plan.result, TabPagerActivationResult::InvalidIndex);
  QCOMPARE(plan.desktopId.has_value(), false);
}

void TabPagerActivationPlannerTest::rejectsInvalidDesktopId() {
  const TabPagerActivationPlan plan =
      tabPagerActivationPlanForIndex(TabPagerDesktopId{});

  QCOMPARE(plan.result, TabPagerActivationResult::InvalidDesktopId);
  QCOMPARE(plan.desktopId.has_value(), false);
}

void TabPagerActivationPlannerTest::
    returnsActivationCommandForValidDesktopId() {
  const TabPagerDesktopId desktopId =
      TabPagerDesktopId::fromVariant(QStringLiteral("work"));

  const TabPagerActivationPlan plan = tabPagerActivationPlanForIndex(desktopId);

  QCOMPARE(plan.result, TabPagerActivationResult::ActivationRequested);
  QCOMPARE(plan.desktopId, desktopId);
}

QTEST_MAIN(TabPagerActivationPlannerTest)

#include "tabpageractivationplanner_test.moc"
