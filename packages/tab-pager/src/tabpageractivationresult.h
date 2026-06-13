// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QString>

enum class TabPagerActivationResult {
  ActivationRequested,
  InvalidIndex,
  InvalidDesktopId,
  NoCurrentDesktop,
  StoppedAtEdge,
  NoWheelStep,
};

[[nodiscard]] QString
tabPagerActivationResultName(TabPagerActivationResult result);
