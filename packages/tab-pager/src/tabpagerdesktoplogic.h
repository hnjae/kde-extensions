// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QString>

namespace TabPagerDesktopLogic {
struct NavigationTargetRequest {
  int currentIndex = -1;
  int desktopCount = 0;
  int offset = 0;
  bool wrappingAround = false;
};

struct WheelDeltaResult {
  int remainingDelta = 0;
  int steps = 0;
};

[[nodiscard]] QString labelForDesktop(int number, const QString &name);
[[nodiscard]] int targetIndexForOffset(const NavigationTargetRequest &request);
[[nodiscard]] WheelDeltaResult consumeWheelDelta(int pendingDelta, int delta);
} // namespace TabPagerDesktopLogic
