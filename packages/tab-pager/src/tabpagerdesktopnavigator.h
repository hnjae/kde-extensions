// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

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
  [[nodiscard]] TabPagerDesktopNavigationResult
  consumeWheelDelta(const TabPagerDesktopNavigationContext &context, int delta);

private:
  bool m_navigationWrappingAround = false;
  int m_pendingWheelDelta = 0;
};
