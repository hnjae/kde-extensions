// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function panelMenuPlacement(location, plasmaCoreTypes, plasmaMenu) {
  if (location === plasmaCoreTypes.LeftEdge) {
    return plasmaMenu.RightPosedTopAlignedPopup;
  }

  if (location === plasmaCoreTypes.TopEdge) {
    return plasmaMenu.BottomPosedLeftAlignedPopup;
  }

  if (location === plasmaCoreTypes.RightEdge) {
    return plasmaMenu.LeftPosedTopAlignedPopup;
  }

  return plasmaMenu.TopPosedLeftAlignedPopup;
}
