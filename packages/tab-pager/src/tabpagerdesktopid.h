// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QVariant>

using TabPagerDesktopId = QVariant;

[[nodiscard]] bool tabPagerDesktopIdIsValid(const TabPagerDesktopId &desktopId);
[[nodiscard]] bool tabPagerDesktopIdsEqual(const TabPagerDesktopId &left,
                                           const TabPagerDesktopId &right);
