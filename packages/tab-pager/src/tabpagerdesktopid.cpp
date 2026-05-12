// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopid.h"

bool tabPagerDesktopIdIsValid(const TabPagerDesktopId &desktopId) {
  return desktopId.isValid();
}

bool tabPagerDesktopIdsEqual(const TabPagerDesktopId &left,
                             const TabPagerDesktopId &right) {
  return tabPagerDesktopIdIsValid(left) && tabPagerDesktopIdIsValid(right) &&
         left == right;
}
