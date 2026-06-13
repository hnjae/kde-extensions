// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopnavigator.h"

namespace {
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
} // namespace

bool TabPagerDesktopNavigator::navigationWrappingAround() const {
  return m_navigationWrappingAround;
}

void TabPagerDesktopNavigator::setNavigationWrappingAround(
    bool navigationWrappingAround) {
  m_navigationWrappingAround = navigationWrappingAround;
}

TabPagerDesktopNavigationResult TabPagerDesktopNavigator::targetForOffset(
    const TabPagerDesktopNavigationContext &context, int offset) const {
  if (context.desktopCount <= 0 || context.currentIndex < 0 ||
      context.currentIndex >= context.desktopCount) {
    return TabPagerDesktopNavigationResult{
        .type = TabPagerDesktopNavigationResultType::NoCurrentDesktop,
    };
  }

  const long long targetIndex =
      static_cast<long long>(context.currentIndex) + offset;
  if (targetIndex >= 0 && targetIndex < context.desktopCount) {
    return TabPagerDesktopNavigationResult{
        .type = TabPagerDesktopNavigationResultType::Target,
        .targetIndex = static_cast<int>(targetIndex),
    };
  }

  if (!m_navigationWrappingAround) {
    return TabPagerDesktopNavigationResult{
        .type = TabPagerDesktopNavigationResultType::StoppedAtEdge,
    };
  }

  return TabPagerDesktopNavigationResult{
      .type = TabPagerDesktopNavigationResultType::Target,
      .targetIndex = wrappedIndexForOffset(context.currentIndex,
                                           context.desktopCount, offset),
  };
}

TabPagerDesktopNavigationResult
TabPagerDesktopNavigator::targetForWheelNavigationResult(
    const TabPagerDesktopNavigationContext &context,
    const TabPagerWheelNavigationResult &wheelNavigationResult) const {
  switch (wheelNavigationResult.type) {
  case TabPagerWheelNavigationResultType::Offset:
    return targetForOffset(context, wheelNavigationResult.offset);
  case TabPagerWheelNavigationResultType::NoWheelStep:
    return TabPagerDesktopNavigationResult{
        .type = TabPagerDesktopNavigationResultType::NoWheelStep,
    };
  }

  return TabPagerDesktopNavigationResult{
      .type = TabPagerDesktopNavigationResultType::NoWheelStep,
  };
}
