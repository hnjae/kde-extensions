// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export { contextMenuActionSections } from "./TaskContextMenuActionSectionsLogic.mjs";
export {
  CONTEXT_MENU_LAUNCHER_COMMAND_KIND,
  CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE,
  CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND,
  CONTEXT_MENU_ROUTE_NONE,
  CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST,
  CONTEXT_MENU_ROUTE_UNAVAILABLE,
  CONTEXT_MENU_TASK_MODEL_REQUEST_KIND,
  contextMenuActionRoute,
  isLauncherActivityUpdateRoute,
  isLauncherCommandRoute,
  isNoneRoute,
  isTaskModelRequestRoute,
  isUnavailableRoute,
} from "./TaskContextMenuRouteLogic.mjs";
export {
  basicActionRoleSnapshot,
  boolRoleData,
  captureCloseRoleSnapshot,
  contextMenuRoleSnapshots,
  fullscreenShadeBorderRoleSnapshot,
  keepAboveBelowRoleSnapshot,
  minimizeMaximizeRoleSnapshot,
  roleData,
  taskRoleSnapshot,
  virtualDesktopRoleSnapshot,
} from "./TaskContextMenuRoleLogic.mjs";
export {
  launcherActivitiesAction,
  launcherActivitiesActionState,
  launcherActivitiesVisible,
  launcherActivityAction,
  launcherActivityActionsSection,
  launcherActivityListSnapshot,
  launcherActivityMenuState,
  launcherActivityToggleUpdateCommand,
  launcherActivityUpdateCommand,
  launcherAllActivitiesAction,
  launcherAllActivitiesUpdateCommand,
  replaceLauncherListCommand,
} from "./TaskContextMenuLauncherActivityLogic.mjs";
export {
  launcherPinStateSnapshot,
  pinActionState,
  pinActionsSection,
  pinLauncherAction,
  pinLauncherCommand,
} from "./TaskContextMenuPinLogic.mjs";
export {
  allTaskActivitiesAction,
  allTaskActivitiesCommand,
  taskActivitiesAction,
  taskActivitiesActionState,
  taskActivityAction,
  taskActivityActionsSection,
  taskActivityMenuState,
  taskActivityToggleCommand,
} from "./TaskContextMenuTaskActivityLogic.mjs";
export {
  allVirtualDesktopsAction,
  allVirtualDesktopsCommand,
  newVirtualDesktopAction,
  newVirtualDesktopActionState,
  newVirtualDesktopCommand,
  virtualDesktopAction,
  virtualDesktopActionsSection,
  virtualDesktopCommand,
  virtualDesktopMenuState,
  virtualDesktopsAction,
  virtualDesktopsActionState,
} from "./TaskContextMenuVirtualDesktopLogic.mjs";
export {
  basicActionsSection,
  basicMoveAction,
  basicResizeAction,
  captureActionsSection,
  checkableWindowActionState,
  checkableWindowCapabilityActionState,
  closeAction,
  closeActionSection,
  closeActionState,
  closeActionsSection,
  closeCommand,
  excludeFromCaptureAction,
  excludeFromCaptureCommand,
  fullscreenAction,
  fullscreenCommand,
  fullscreenShadeBorderActionsSection,
  keepAboveAction,
  keepAboveBelowActionsSection,
  keepAboveCommand,
  keepBelowAction,
  keepBelowCommand,
  maximizeAction,
  maximizeCommand,
  menuActionSection,
  menuActionSectionVisible,
  minimizeAction,
  minimizeCommand,
  minimizeMaximizeActionsSection,
  moveCommand,
  moreActionsSection,
  newInstanceAction,
  newInstanceActionState,
  newInstanceCommand,
  noBorderAction,
  noBorderCommand,
  resizeCommand,
  shadeAction,
  shadeCommand,
  windowCapabilityActionState,
} from "./TaskContextMenuWindowActionLogic.mjs";

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
