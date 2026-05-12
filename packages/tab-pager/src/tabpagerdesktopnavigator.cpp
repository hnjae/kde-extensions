// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopnavigator.h"

namespace {
constexpr int wheelDeltaPerStep = 120;
constexpr int invalidDesktopIndex = -1;

struct WheelDeltaResult {
  int remainingDelta = 0;
  int steps = 0;
};

[[nodiscard]] int wrappedIndexForOffset(int currentIndex, int desktopCount,
                                        int offset) {
  const int wrappedOffset = offset % desktopCount;
  int wrappedIndex = static_cast<int>(
      (static_cast<long long>(currentIndex) + wrappedOffset) % desktopCount);
  if (wrappedIndex < 0) {
    wrappedIndex += desktopCount;
  }

  return wrappedIndex;
}

[[nodiscard]] WheelDeltaResult consumeWheelDelta(int pendingDelta, int delta) {
  const long long accumulatedDelta =
      static_cast<long long>(pendingDelta) + delta;

  return WheelDeltaResult{
      .remainingDelta = static_cast<int>(accumulatedDelta % wheelDeltaPerStep),
      .steps = static_cast<int>(accumulatedDelta / wheelDeltaPerStep),
  };
}
} // namespace

bool TabPagerDesktopNavigator::navigationWrappingAround() const {
  return m_navigationWrappingAround;
}

void TabPagerDesktopNavigator::setNavigationWrappingAround(
    bool navigationWrappingAround) {
  m_navigationWrappingAround = navigationWrappingAround;
}

int TabPagerDesktopNavigator::targetIndexForOffset(
    const TabPagerDesktopNavigationContext &context, int offset) const {
  if (context.desktopCount <= 0 || context.currentIndex < 0 ||
      context.currentIndex >= context.desktopCount) {
    return invalidDesktopIndex;
  }

  const long long targetIndex =
      static_cast<long long>(context.currentIndex) + offset;
  if (targetIndex >= 0 && targetIndex < context.desktopCount) {
    return static_cast<int>(targetIndex);
  }

  if (!m_navigationWrappingAround) {
    return invalidDesktopIndex;
  }

  return wrappedIndexForOffset(context.currentIndex, context.desktopCount,
                               offset);
}

int TabPagerDesktopNavigator::targetIndexForWheelDelta(
    const TabPagerDesktopNavigationContext &context, int delta) {
  const WheelDeltaResult result = consumeWheelDelta(m_pendingWheelDelta, delta);
  m_pendingWheelDelta = result.remainingDelta;

  if (result.steps == 0) {
    return invalidDesktopIndex;
  }

  return targetIndexForOffset(context, -result.steps);
}
