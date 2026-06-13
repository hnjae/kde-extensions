// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  contextMenuLauncherCommand,
  contextMenuTaskCommand,
} from "./TaskActionLogic.mjs";
import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";
import * as LauncherActivityLogic from "./TaskContextMenuLauncherActivityLogic.mjs";
import * as VirtualDesktopLogic from "./VirtualDesktopLogic.mjs";
import { taskActivitiesAfterToggle } from "./TaskActivityLogic.mjs";
import { launcherPinState } from "./LauncherListLogic.mjs";
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

export function pinActionState(pinState) {
  const state = pinState || {};
  const isPinned = Boolean(state.isPinned);

  return {
    action: isPinned ? "unpin" : "pin",
    enabled: Boolean(state.canPin),
    text: isPinned ? "Unpin from Task Manager" : "Pin to Task Manager",
  };
}

export function pinLauncherCommand(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);
  return contextMenuLauncherCommand(
    action.action === "unpin" ? "unpinLauncher" : "pinLauncher",
    state.launcherUrl,
  );
}

export function pinLauncherAction(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);

  return actionWithIcon(
    Object.assign({}, action, {
      command: pinLauncherCommand(state),
    }),
    action.action === "unpin" ? "window-unpin" : "window-pin",
  );
}

export function pinActionsSection(sectionState) {
  return {
    pinLauncher: pinLauncherAction(sectionState),
  };
}

export function launcherPinStateSnapshot(
  launcherList,
  launcherUrl,
  currentActivity,
  launcherPosition,
) {
  return launcherPinState(
    launcherList,
    launcherUrl,
    currentActivity,
    launcherPosition,
  );
}

export function newInstanceActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.canLaunchNewInstance || state.isLauncher),
  };
}

export function newInstanceCommand() {
  return contextMenuTaskCommand("requestNewInstance");
}

export function newInstanceAction(taskState) {
  return actionWithIcon(
    Object.assign({}, newInstanceActionState(taskState), {
      command: newInstanceCommand(),
      text: "New Instance",
    }),
    "window-new",
  );
}

export function moveCommand() {
  return contextMenuTaskCommand("requestMove");
}

export function resizeCommand() {
  return contextMenuTaskCommand("requestResize");
}

export function basicMoveAction(taskState) {
  return actionWithIcon(
    Object.assign({}, windowCapabilityActionState(taskState), {
      command: moveCommand(),
      text: "Move",
    }),
    "transform-move",
  );
}

export function basicResizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, windowCapabilityActionState(taskState), {
      command: resizeCommand(),
      text: "Resize",
    }),
    "transform-scale",
  );
}

export function basicActionsSection(sectionState) {
  const state = sectionState || {};
  const newInstance = newInstanceAction({
    canLaunchNewInstance: state.canLaunchNewInstance,
    hasTask: state.hasTask,
    isLauncher: state.isLauncher,
  });
  const move = basicMoveAction({
    capable: state.isMovable,
    hasWindowTask: state.hasWindowTask,
    isWindow: state.isWindow,
  });
  const resize = basicResizeAction({
    capable: state.isResizable,
    hasWindowTask: state.hasWindowTask,
    isWindow: state.isWindow,
  });

  return {
    move,
    newInstance,
    resize,
    separator: menuActionSection({
      hasWindowTask: state.hasWindowTask,
      launcherActivitiesVisible: state.launcherActivitiesVisible,
      newInstanceVisible: newInstance.visible,
    }),
  };
}

export function minimizeCommand() {
  return contextMenuTaskCommand("requestToggleMinimized");
}

export function maximizeCommand() {
  return contextMenuTaskCommand("requestToggleMaximized");
}

export function minimizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: minimizeCommand(),
      text: "Minimize",
    }),
    "window-minimize",
  );
}

export function maximizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: maximizeCommand(),
      text: "Maximize",
    }),
    "window-maximize",
  );
}

export function minimizeMaximizeActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    maximize: maximizeAction({
      capable: state.isMaximizable,
      checked: state.isMaximized,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    minimize: minimizeAction({
      capable: state.isMinimizable,
      checked: state.isMinimized,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function keepAboveCommand() {
  return contextMenuTaskCommand("requestToggleKeepAbove");
}

export function keepBelowCommand() {
  return contextMenuTaskCommand("requestToggleKeepBelow");
}

export function keepAboveAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: keepAboveCommand(),
      text: "Keep Above Others",
    }),
    "window-keep-above",
  );
}

export function keepBelowAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: keepBelowCommand(),
      text: "Keep Below Others",
    }),
    "window-keep-below",
  );
}

export function keepAboveBelowActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    keepAbove: keepAboveAction({
      checked: state.isKeepAbove,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    keepBelow: keepBelowAction({
      checked: state.isKeepBelow,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function fullscreenCommand() {
  return contextMenuTaskCommand("requestToggleFullScreen");
}

export function shadeCommand() {
  return contextMenuTaskCommand("requestToggleShaded");
}

export function noBorderCommand() {
  return contextMenuTaskCommand("requestToggleNoBorder");
}

export function fullscreenAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: fullscreenCommand(),
      text: "Fullscreen",
    }),
    "view-fullscreen",
  );
}

export function shadeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: shadeCommand(),
      text: "Shade",
    }),
    "window-shade",
  );
}

export function noBorderAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: noBorderCommand(),
      text: "No Border",
    }),
    "edit-none-border",
  );
}

export function fullscreenShadeBorderActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    fullscreen: fullscreenAction({
      capable: state.fullScreenable,
      checked: state.isFullScreen,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    noBorder: noBorderAction({
      capable: state.canSetNoBorder,
      checked: state.hasNoBorder,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    shade: shadeAction({
      capable: state.isShadeable,
      checked: state.isShaded,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function excludeFromCaptureCommand() {
  return contextMenuTaskCommand("requestToggleExcludeFromCapture");
}

export function closeCommand() {
  return contextMenuTaskCommand("requestClose");
}

export function excludeFromCaptureAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: excludeFromCaptureCommand(),
      text: "Hide from Screencasts",
    }),
    "view-private",
  );
}

export function captureActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    excludeFromCapture: excludeFromCaptureAction({
      checked: state.isExcludedFromCapture,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function closeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, closeActionState(taskState), {
      command: closeCommand(),
      text: "Close",
    }),
    "window-close",
  );
}

export function closeActionSection(closeActionState) {
  const state = closeActionState || {};
  return {
    visible: Boolean(state.visible),
  };
}

export function closeActionsSection(sectionState) {
  const close = closeAction(sectionState);

  return {
    close,
    separator: closeActionSection(close),
  };
}

export function allTaskActivitiesCommand() {
  return contextMenuTaskCommand("requestActivities", []);
}

export function windowCapabilityActionState(taskState) {
  const state = taskState || {};
  const capable = Boolean(state.capable);

  return {
    enabled: Boolean(state.hasWindowTask && capable),
    visible: Boolean(state.isWindow && capable),
  };
}

export function checkableWindowCapabilityActionState(taskState) {
  const state = taskState || {};
  const actionState = windowCapabilityActionState(state);

  return Object.assign({}, actionState, {
    checked: Boolean(state.checked),
  });
}

export function checkableWindowActionState(taskState) {
  const state = taskState || {};

  return {
    checked: Boolean(state.checked),
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow),
  };
}

export function menuActionSectionVisible(sectionState) {
  const state = sectionState || {};
  return Boolean(
    state.launcherActivitiesVisible ||
      state.newInstanceVisible ||
      state.hasWindowTask,
  );
}

export function menuActionSection(sectionState) {
  return {
    visible: menuActionSectionVisible(sectionState),
  };
}

export function virtualDesktopsActionState(taskState) {
  const state = taskState || {};
  return windowCapabilityActionState(
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

export function taskActivitiesActionState(taskState) {
  const state = taskState || {};
  const activityEntryCount = Number(state.activityEntryCount || 0);

  return {
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow && activityEntryCount > 1),
  };
}

export function taskActivitiesAction(taskState) {
  return actionWithIcon(
    Object.assign({}, taskActivitiesActionState(taskState), {
      text: "Activities",
    }),
    "activities",
  );
}

export function closeActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.isWindow && state.closable),
  };
}

export function moreActionsSection(sectionState) {
  const state = sectionState || {};
  const actions = Array.from(state.actions || []);
  const visible = actions.some((action) => Boolean(action?.visible));

  return {
    moreActions: actionWithIcon(
      {
        enabled: visible,
        text: "More",
        visible,
      },
      "view-more-symbolic",
    ),
  };
}

export function taskActivityMenuState(taskActivities, activityId) {
  const activities = Array.from(taskActivities || []);
  const allActivitiesChecked = ActivityScopeLogic.activitiesAreAll(activities);

  return {
    activityChecked:
      allActivitiesChecked ||
      ActivityScopeLogic.stringListContains(activities, activityId),
    allActivitiesChecked,
  };
}

export function taskActivityToggleCommand(taskActivities, activityId) {
  return contextMenuTaskCommand(
    "requestActivities",
    taskActivitiesAfterToggle(taskActivities, activityId),
  );
}

export function allTaskActivitiesAction(taskActivities) {
  const activityState = taskActivityMenuState(taskActivities, "");

  return {
    checked: activityState.allActivitiesChecked,
    command: allTaskActivitiesCommand(),
    text: "All Activities",
  };
}

export function taskActivityAction(taskActivities, activity) {
  const entry = activity || {};
  const activityState = taskActivityMenuState(taskActivities, entry.id);

  return {
    checked: activityState.activityChecked,
    command: taskActivityToggleCommand(taskActivities, entry.id),
    text: entry.name,
  };
}

export function taskActivityActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    activityAction: (activity) =>
      taskActivityAction(state.activities, activity),
    allTaskActivities: allTaskActivitiesAction(state.activities),
    taskActivities: taskActivitiesAction({
      activityEntryCount: state.activityEntryCount,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
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

  const basicActions = basicActionsSection({
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
  const captureActions = captureActionsSection({
    hasWindowTask: state.hasWindowTask,
    isExcludedFromCapture: captureCloseRoles.isExcludedFromCapture,
    isWindow: state.isWindow,
  });
  const fullscreenShadeBorderActions = fullscreenShadeBorderActionsSection({
    canSetNoBorder: fullscreenShadeBorderRoles.canSetNoBorder,
    fullScreenable: fullscreenShadeBorderRoles.fullScreenable,
    hasNoBorder: fullscreenShadeBorderRoles.hasNoBorder,
    hasWindowTask: state.hasWindowTask,
    isFullScreen: fullscreenShadeBorderRoles.isFullScreen,
    isShadeable: fullscreenShadeBorderRoles.isShadeable,
    isShaded: fullscreenShadeBorderRoles.isShaded,
    isWindow: state.isWindow,
  });
  const keepAboveBelowActions = keepAboveBelowActionsSection({
    hasWindowTask: state.hasWindowTask,
    isKeepAbove: keepAboveBelowRoles.isKeepAbove,
    isKeepBelow: keepAboveBelowRoles.isKeepBelow,
    isWindow: state.isWindow,
  });
  const minimizeMaximizeActions = minimizeMaximizeActionsSection({
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
    closeActions: closeActionsSection({
      closable: captureCloseRoles.closable,
      hasTask: state.hasTask,
      isWindow: state.isWindow,
    }),
    fullscreenShadeBorderActions,
    keepAboveBelowActions,
    launcherActivityActions,
    minimizeMaximizeActions,
    pinActions: pinActionsSection(state.pinState),
    taskActivityActions: taskActivityActionsSection({
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
    value: moreActionsSection({
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
