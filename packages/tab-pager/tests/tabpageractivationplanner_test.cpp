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
  void mapsNavigationTargetToIndexActivationRequest();
  void mapsNavigationTargetToDesktopActivationCommand();
  void mapsNavigationNoOpResults();
  void mapsWheelNavigationResults();
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

void TabPagerActivationPlannerTest::
    mapsNavigationTargetToIndexActivationRequest() {
  const TabPagerActivationPlan plan =
      tabPagerActivationPlanForNavigationResult(TabPagerDesktopNavigationResult{
          .type = TabPagerDesktopNavigationResultType::Target,
          .targetIndex = 2,
      });

  QCOMPARE(plan.result, TabPagerActivationResult::ActivationRequested);
  QCOMPARE(plan.targetIndex, 2);
  QCOMPARE(plan.desktopId.has_value(), false);
}

void TabPagerActivationPlannerTest::
    mapsNavigationTargetToDesktopActivationCommand() {
  const TabPagerDesktopNavigationResult target{
      .type = TabPagerDesktopNavigationResultType::Target,
      .targetIndex = 2,
  };
  const TabPagerDesktopId desktopId =
      TabPagerDesktopId::fromVariant(QStringLiteral("work"));

  const TabPagerActivationPlan validPlan =
      tabPagerActivationPlanForNavigationTarget(target, desktopId);
  const TabPagerActivationPlan missingPlan =
      tabPagerActivationPlanForNavigationTarget(target, std::nullopt);
  const TabPagerActivationPlan invalidPlan =
      tabPagerActivationPlanForNavigationTarget(target, TabPagerDesktopId{});

  QCOMPARE(validPlan.result, TabPagerActivationResult::ActivationRequested);
  QCOMPARE(validPlan.desktopId, desktopId);
  QCOMPARE(validPlan.targetIndex.has_value(), false);
  QCOMPARE(missingPlan.result, TabPagerActivationResult::InvalidIndex);
  QCOMPARE(missingPlan.desktopId.has_value(), false);
  QCOMPARE(invalidPlan.result, TabPagerActivationResult::InvalidDesktopId);
  QCOMPARE(invalidPlan.desktopId.has_value(), false);
}

void TabPagerActivationPlannerTest::mapsNavigationNoOpResults() {
  const TabPagerActivationPlan noCurrentDesktop =
      tabPagerActivationPlanForNavigationResult(TabPagerDesktopNavigationResult{
          .type = TabPagerDesktopNavigationResultType::NoCurrentDesktop,
      });
  const TabPagerActivationPlan stoppedAtEdge =
      tabPagerActivationPlanForNavigationResult(TabPagerDesktopNavigationResult{
          .type = TabPagerDesktopNavigationResultType::StoppedAtEdge,
      });
  const TabPagerActivationPlan noWheelStep =
      tabPagerActivationPlanForNavigationResult(TabPagerDesktopNavigationResult{
          .type = TabPagerDesktopNavigationResultType::NoWheelStep,
      });

  QCOMPARE(noCurrentDesktop.result, TabPagerActivationResult::NoCurrentDesktop);
  QCOMPARE(noCurrentDesktop.targetIndex.has_value(), false);
  QCOMPARE(stoppedAtEdge.result, TabPagerActivationResult::StoppedAtEdge);
  QCOMPARE(stoppedAtEdge.targetIndex.has_value(), false);
  QCOMPARE(noWheelStep.result, TabPagerActivationResult::NoWheelStep);
  QCOMPARE(noWheelStep.targetIndex.has_value(), false);
}

void TabPagerActivationPlannerTest::mapsWheelNavigationResults() {
  const TabPagerActivationPlan noWheelStep =
      tabPagerActivationPlanForWheelNavigationResult(
          TabPagerWheelNavigationResult{
              .type = TabPagerWheelNavigationResultType::NoWheelStep,
              .offset = 0,
          });
  const TabPagerActivationPlan offset =
      tabPagerActivationPlanForWheelNavigationResult(
          TabPagerWheelNavigationResult{
              .type = TabPagerWheelNavigationResultType::Offset,
              .offset = -1,
          });

  QCOMPARE(noWheelStep.result, TabPagerActivationResult::NoWheelStep);
  QCOMPARE(noWheelStep.targetIndex.has_value(), false);
  QCOMPARE(noWheelStep.desktopId.has_value(), false);
  QCOMPARE(offset.result, TabPagerActivationResult::ActivationRequested);
  QCOMPARE(offset.targetIndex, -1);
  QCOMPARE(offset.desktopId.has_value(), false);
}

QTEST_MAIN(TabPagerActivationPlannerTest)

#include "tabpageractivationplanner_test.moc"
