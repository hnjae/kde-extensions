// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QString>

namespace TabPagerDesktopLogic {
[[nodiscard]] QString labelForDesktop(int number, const QString &name);
[[nodiscard]] int targetIndexForOffset(int currentIndex, int desktopCount,
                                       int offset, bool wrappingAround);
} // namespace TabPagerDesktopLogic
