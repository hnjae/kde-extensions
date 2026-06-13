// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerwheelnavigation.h"

namespace {
constexpr int wheelDeltaPerStep = 120;
}

TabPagerWheelNavigationResult TabPagerWheelNavigation::consumeDelta(int delta) {
  const long long accumulatedDelta =
      static_cast<long long>(m_pendingDelta) + delta;
  m_pendingDelta = static_cast<int>(accumulatedDelta % wheelDeltaPerStep);

  const int steps = static_cast<int>(accumulatedDelta / wheelDeltaPerStep);
  if (steps == 0) {
    return TabPagerWheelNavigationResult{
        .type = TabPagerWheelNavigationResultType::NoWheelStep,
    };
  }

  return TabPagerWheelNavigationResult{
      .type = TabPagerWheelNavigationResultType::Offset,
      .offset = -steps,
  };
}
