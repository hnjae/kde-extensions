// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QString>

#include <cstdint>

enum class TabPagerActivationResult : std::uint8_t {
  ActivationRequested,
  InvalidIndex,
  InvalidDesktopId,
  NoCurrentDesktop,
  StoppedAtEdge,
  NoWheelStep,
};

[[nodiscard]] QString
tabPagerActivationResultName(TabPagerActivationResult result);
