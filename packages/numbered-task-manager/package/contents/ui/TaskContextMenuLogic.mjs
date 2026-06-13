// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { contextMenuTaskCommand } from "./TaskActionLogic.mjs";
import * as LauncherActivityLogic from "./TaskContextMenuLauncherActivityLogic.mjs";
import * as PinLogic from "./TaskContextMenuPinLogic.mjs";
import * as TaskActivityLogic from "./TaskContextMenuTaskActivityLogic.mjs";
import * as VirtualDesktopLogic from "./VirtualDesktopLogic.mjs";
import * as WindowActionLogic from "./TaskContextMenuWindowActionLogic.mjs";
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

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
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

export function virtualDesktopsActionState(taskState) {
  const state = taskState || {};
  return WindowActionLogic.windowCapabilityActionState(
    Object.assign({}, state, {
      capable: state.changeable,
    }),
  );
}

export function virtualDesktopsAction(taskState) {
  return actionWithIcon(
    Object.assign({}, virtualDesktopsActionState(taskState), {
      text: "Move to Desktop",
    }),
    "virtual-desktops",
  );
}

export function newVirtualDesktopActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasWindowTask),
  };
}

export function newVirtualDesktopAction(taskState) {
  return actionWithIcon(
    Object.assign({}, newVirtualDesktopActionState(taskState), {
      command: newVirtualDesktopCommand(),
      text: "New Desktop",
    }),
    "list-add",
  );
}

export function virtualDesktopMenuState(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
  return VirtualDesktopLogic.virtualDesktopMenuState(
    virtualDesktops,
    isOnAllDesktops,
    desktop,
  );
}

export function allVirtualDesktopsCommand() {
  return contextMenuTaskCommand("requestVirtualDesktops", []);
}

export function virtualDesktopCommand(desktopId) {
  return contextMenuTaskCommand("requestVirtualDesktops", [desktopId]);
}

export function newVirtualDesktopCommand() {
  return contextMenuTaskCommand("requestNewVirtualDesktop");
}

export function allVirtualDesktopsAction(virtualDesktops, isOnAllDesktops) {
  const desktopState = virtualDesktopMenuState(
    virtualDesktops,
    isOnAllDesktops,
    "",
  );

  return {
    checked: desktopState.allDesktopsChecked,
    command: allVirtualDesktopsCommand(),
    text: "All Desktops",
  };
}

export function virtualDesktopAction(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
  const entry = desktop || {};
  const desktopState = virtualDesktopMenuState(
    virtualDesktops,
    isOnAllDesktops,
    entry,
  );

  return {
    checked: desktopState.desktopChecked,
    command: virtualDesktopCommand(entry.id),
    text: entry.name,
  };
}

export function virtualDesktopActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    allVirtualDesktops: allVirtualDesktopsAction(
      state.virtualDesktops,
      state.isOnAllVirtualDesktops,
    ),
    desktopAction: (desktop) =>
      virtualDesktopAction(
        state.virtualDesktops,
        state.isOnAllVirtualDesktops,
        desktop,
      ),
    newVirtualDesktop: newVirtualDesktopAction({
      hasWindowTask: state.hasWindowTask,
    }),
    virtualDesktops: virtualDesktopsAction({
      changeable: state.changeable,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

function unavailableActionRoute(actionState) {
  const state = actionState || {};
  const code = state.visible === false ? "action-hidden" : "action-disabled";

  return {
    code,
    command: state.command || null,
    kind: "unavailable",
    update: state.update || null,
  };
}

export function contextMenuActionRoute(actionState) {
  const state = actionState || {};
  if (state.visible === false || state.enabled === false) {
    return unavailableActionRoute(state);
  }

  if (state.update) {
    return {
      command: null,
      kind: "launcher-activity-update",
      update: state.update,
    };
  }

  const command = state.command || null;
  if (!command) {
    return {
      command: null,
      kind: "none",
      update: null,
    };
  }

  if (command.kind === "launcher-command") {
    return {
      command,
      kind: "launcher-command",
      update: null,
    };
  }

  return {
    command,
    kind: "task-model-request",
    update: null,
  };
}

export function contextMenuActionSections(menuState) {
  const state = menuState || {};
  const basicRoles = state.basicActionRoles || {};
  const captureCloseRoles = state.captureCloseRoles || {};
  const fullscreenShadeBorderRoles = state.fullscreenShadeBorderRoles || {};
  const keepAboveBelowRoles = state.keepAboveBelowRoles || {};
  const minimizeMaximizeRoles = state.minimizeMaximizeRoles || {};
  const taskRoles = state.taskRoles || {};
  const virtualDesktopRoles = state.virtualDesktopRoles || {};

  const launcherActivityActions =
    LauncherActivityLogic.launcherActivityActionsSection({
      activityEntryCount: state.activityEntryCount,
      currentActivity: state.currentActivity,
      hasTaskModel: state.hasTaskModel,
      launcherActivities: state.launcherActivities,
      launcherList: state.launcherList,
      launcherPosition: state.launcherPosition,
      pinState: state.pinState,
    });

  const basicActions = WindowActionLogic.basicActionsSection({
    canLaunchNewInstance: basicRoles.canLaunchNewInstance,
    hasTask: state.hasTask,
    hasWindowTask: state.hasWindowTask,
    isLauncher: basicRoles.isLauncher,
    isMovable: basicRoles.isMovable,
    isResizable: basicRoles.isResizable,
    isWindow: state.isWindow,
    launcherActivitiesVisible:
      launcherActivityActions.launcherActivities.visible,
  });
  const captureActions = WindowActionLogic.captureActionsSection({
    hasWindowTask: state.hasWindowTask,
    isExcludedFromCapture: captureCloseRoles.isExcludedFromCapture,
    isWindow: state.isWindow,
  });
  const fullscreenShadeBorderActions =
    WindowActionLogic.fullscreenShadeBorderActionsSection({
      canSetNoBorder: fullscreenShadeBorderRoles.canSetNoBorder,
      fullScreenable: fullscreenShadeBorderRoles.fullScreenable,
      hasNoBorder: fullscreenShadeBorderRoles.hasNoBorder,
      hasWindowTask: state.hasWindowTask,
      isFullScreen: fullscreenShadeBorderRoles.isFullScreen,
      isShadeable: fullscreenShadeBorderRoles.isShadeable,
      isShaded: fullscreenShadeBorderRoles.isShaded,
      isWindow: state.isWindow,
    });
  const keepAboveBelowActions = WindowActionLogic.keepAboveBelowActionsSection({
    hasWindowTask: state.hasWindowTask,
    isKeepAbove: keepAboveBelowRoles.isKeepAbove,
    isKeepBelow: keepAboveBelowRoles.isKeepBelow,
    isWindow: state.isWindow,
  });
  const minimizeMaximizeActions =
    WindowActionLogic.minimizeMaximizeActionsSection({
      hasWindowTask: state.hasWindowTask,
      isMaximizable: minimizeMaximizeRoles.isMaximizable,
      isMaximized: minimizeMaximizeRoles.isMaximized,
      isMinimizable: minimizeMaximizeRoles.isMinimizable,
      isMinimized: minimizeMaximizeRoles.isMinimized,
      isWindow: state.isWindow,
    });
  const sections = {
    basicActions,
    captureActions,
    closeActions: WindowActionLogic.closeActionsSection({
      closable: captureCloseRoles.closable,
      hasTask: state.hasTask,
      isWindow: state.isWindow,
    }),
    fullscreenShadeBorderActions,
    keepAboveBelowActions,
    launcherActivityActions,
    minimizeMaximizeActions,
    pinActions: PinLogic.pinActionsSection(state.pinState),
    taskActivityActions: TaskActivityLogic.taskActivityActionsSection({
      activities: taskRoles.activities,
      activityEntryCount: state.activityEntryCount,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    virtualDesktopActions: virtualDesktopActionsSection({
      changeable: virtualDesktopRoles.isVirtualDesktopsChangeable,
      hasWindowTask: state.hasWindowTask,
      isOnAllVirtualDesktops: virtualDesktopRoles.isOnAllVirtualDesktops,
      isWindow: state.isWindow,
      virtualDesktops: taskRoles.virtualDesktops,
    }),
  };
  Object.defineProperty(sections, "moreActions", {
    configurable: true,
    enumerable: false,
    value: WindowActionLogic.moreActionsSection({
      actions: [
        basicActions.move,
        basicActions.resize,
        minimizeMaximizeActions.maximize,
        minimizeMaximizeActions.minimize,
        keepAboveBelowActions.keepAbove,
        keepAboveBelowActions.keepBelow,
        fullscreenShadeBorderActions.fullscreen,
        fullscreenShadeBorderActions.shade,
        fullscreenShadeBorderActions.noBorder,
        captureActions.excludeFromCapture,
      ],
    }),
  });
  return sections;
}
