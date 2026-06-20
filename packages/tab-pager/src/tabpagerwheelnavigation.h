// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <cstdint>

enum class TabPagerWheelNavigationResultType : std::uint8_t {
  Offset,
  NoWheelStep,
};

struct TabPagerWheelNavigationResult {
  TabPagerWheelNavigationResultType type =
      TabPagerWheelNavigationResultType::NoWheelStep;
  int offset = 0;
};

class TabPagerWheelNavigation final {
public:
  [[nodiscard]] TabPagerWheelNavigationResult consumeDelta(int delta);

private:
  int m_pendingDelta = 0;
};
