// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ActionSectionsLogic from "./TaskContextMenuActionSectionsLogic.mjs";

export function panelMenuPlacement(location, plasmaCoreTypes, plasmaMenu) {
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

export function virtualDesktopEntriesSnapshot(desktopIds, desktopNames) {
  const ids = Array.from(desktopIds || []);
  const names = Array.from(desktopNames || []);
  const entries = [];
  for (let i = 0; i < ids.length; ++i) {
    entries.push({
      id: ids[i],
      name: names[i] || `Desktop ${(i + 1).toString()}`,
    });
  }
  return entries;
}

export function activityEntriesSnapshot(
  activityIds,
  activityName,
  activityIcon,
) {
  const ids = Array.from(activityIds || []);
  const nameForActivity =
    typeof activityName === "function" ? activityName : null;
  const iconForActivity =
    typeof activityIcon === "function" ? activityIcon : null;
  const entries = [];
  for (let i = 0; i < ids.length; ++i) {
    const id = String(ids[i]);
    const name = nameForActivity ? nameForActivity(id) : "";
    const icon = iconForActivity ? iconForActivity(id) : "";
    entries.push({
      icon,
      id,
      name: name || id,
    });
  }
  return entries;
}

export function contextMenuActionSections(menuState) {
  return ActionSectionsLogic.contextMenuActionSections(menuState);
}
