// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerwheelnavigation.h"

struct TabPagerDesktopNavigationContext {
  int currentIndex = -1;
  int desktopCount = 0;
};

enum class TabPagerDesktopNavigationResultType {
  Target,
  NoCurrentDesktop,
  StoppedAtEdge,
  NoWheelStep,
};

struct TabPagerDesktopNavigationResult {
  TabPagerDesktopNavigationResultType type =
      TabPagerDesktopNavigationResultType::NoCurrentDesktop;
  int targetIndex = -1;
};

class TabPagerDesktopNavigator final {
public:
  [[nodiscard]] bool navigationWrappingAround() const;
  void setNavigationWrappingAround(bool navigationWrappingAround);

  [[nodiscard]] TabPagerDesktopNavigationResult
  targetForOffset(const TabPagerDesktopNavigationContext &context,
                  int offset) const;
  [[nodiscard]] TabPagerDesktopNavigationResult targetForWheelNavigationResult(
      const TabPagerDesktopNavigationContext &context,
      const TabPagerWheelNavigationResult &wheelNavigationResult) const;

private:
  bool m_navigationWrappingAround = false;
};
