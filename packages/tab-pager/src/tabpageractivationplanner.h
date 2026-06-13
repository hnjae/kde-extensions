// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopid.h"
#include "tabpagerdesktopnavigator.h"
#include "tabpagerwheelnavigation.h"

#include <optional>

enum class TabPagerActivationResult {
  ActivationRequested,
  InvalidIndex,
  InvalidDesktopId,
  NoCurrentDesktop,
  StoppedAtEdge,
  NoWheelStep,
};

struct TabPagerActivationPlan {
  TabPagerActivationResult result = TabPagerActivationResult::InvalidIndex;
  std::optional<TabPagerDesktopId> desktopId;
  std::optional<int> targetIndex;
};

struct TabPagerWheelActivationPlan {
  TabPagerActivationResult result = TabPagerActivationResult::NoWheelStep;
  std::optional<int> offset;
};

[[nodiscard]] TabPagerActivationPlan tabPagerActivationPlanForIndex(
    const std::optional<TabPagerDesktopId> &desktopId);
[[nodiscard]] TabPagerActivationPlan tabPagerActivationPlanForNavigationResult(
    const TabPagerDesktopNavigationResult &navigationResult);
[[nodiscard]] TabPagerActivationPlan tabPagerActivationPlanForNavigationTarget(
    const TabPagerDesktopNavigationResult &navigationResult,
    const std::optional<TabPagerDesktopId> &desktopId);
[[nodiscard]] TabPagerWheelActivationPlan
tabPagerActivationPlanForWheelNavigationResult(
    const TabPagerWheelNavigationResult &wheelNavigationResult);
