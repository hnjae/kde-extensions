// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <optional>

struct TabPagerDesktopNavigationContext {
  int currentIndex = -1;
  int desktopCount = 0;
};

class TabPagerDesktopNavigator final {
public:
  [[nodiscard]] bool navigationWrappingAround() const;
  void setNavigationWrappingAround(bool navigationWrappingAround);

  [[nodiscard]] std::optional<int>
  targetIndexForOffset(const TabPagerDesktopNavigationContext &context,
                       int offset) const;
  [[nodiscard]] std::optional<int>
  targetIndexForWheelDelta(const TabPagerDesktopNavigationContext &context,
                           int delta);

private:
  bool m_navigationWrappingAround = false;
  int m_pendingWheelDelta = 0;
};
