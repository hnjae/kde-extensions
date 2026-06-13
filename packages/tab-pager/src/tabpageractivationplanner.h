// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopid.h"

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
};

[[nodiscard]] TabPagerActivationPlan tabPagerActivationPlanForIndex(
    const std::optional<TabPagerDesktopId> &desktopId);
