// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpageractivationplanner.h"

TabPagerActivationPlan tabPagerActivationPlanForIndex(
    const std::optional<TabPagerDesktopId> &desktopId) {
  if (!desktopId.has_value()) {
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::InvalidIndex,
        .desktopId = std::nullopt,
        .targetIndex = std::nullopt,
    };
  }

  if (!desktopId->isValid()) {
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::InvalidDesktopId,
        .desktopId = std::nullopt,
        .targetIndex = std::nullopt,
    };
  }

  return TabPagerActivationPlan{
      .result = TabPagerActivationResult::ActivationRequested,
      .desktopId = *desktopId,
      .targetIndex = std::nullopt,
  };
}

TabPagerActivationPlan tabPagerActivationPlanForNavigationResult(
    const TabPagerDesktopNavigationResult &navigationResult) {
  switch (navigationResult.type) {
  case TabPagerDesktopNavigationResultType::Target:
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::ActivationRequested,
        .desktopId = std::nullopt,
        .targetIndex = navigationResult.targetIndex,
    };
  case TabPagerDesktopNavigationResultType::NoCurrentDesktop:
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::NoCurrentDesktop,
        .desktopId = std::nullopt,
        .targetIndex = std::nullopt,
    };
  case TabPagerDesktopNavigationResultType::StoppedAtEdge:
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::StoppedAtEdge,
        .desktopId = std::nullopt,
        .targetIndex = std::nullopt,
    };
  case TabPagerDesktopNavigationResultType::NoWheelStep:
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::NoWheelStep,
        .desktopId = std::nullopt,
        .targetIndex = std::nullopt,
    };
  }

  return TabPagerActivationPlan{
      .result = TabPagerActivationResult::NoCurrentDesktop,
      .desktopId = std::nullopt,
      .targetIndex = std::nullopt,
  };
}
