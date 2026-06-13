// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpageractivationplanner.h"

TabPagerActivationPlan tabPagerActivationPlanForIndex(
    const std::optional<TabPagerDesktopId> &desktopId) {
  if (!desktopId.has_value()) {
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::InvalidIndex,
        .desktopId = std::nullopt,
    };
  }

  if (!desktopId->isValid()) {
    return TabPagerActivationPlan{
        .result = TabPagerActivationResult::InvalidDesktopId,
        .desktopId = std::nullopt,
    };
  }

  return TabPagerActivationPlan{
      .result = TabPagerActivationResult::ActivationRequested,
      .desktopId = *desktopId,
  };
}
