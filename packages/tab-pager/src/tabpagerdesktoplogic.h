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

[[nodiscard]] QString labelForDesktop(int number, const QString &name);
[[nodiscard]] int targetIndexForOffset(const NavigationTargetRequest &request);
} // namespace TabPagerDesktopLogic
