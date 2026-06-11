// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  contextMenuLauncherCommand,
  contextMenuTaskCommand,
} from "./TaskActionLogic.mjs";
import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";
import { taskActivitiesAfterToggle } from "./TaskActivityLogic.mjs";
import {
  launcherActivitiesAfterAllToggle,
  launcherActivitiesAfterToggle,
  launcherActivityUpdate,
  launcherPinState,
  normalizedLauncherList,
} from "./LauncherListLogic.mjs";
import { launcherUrlFromRoles } from "./TaskEntryLogic.mjs";

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

  return Object.assign({}, action, {
    command: pinLauncherCommand(state),
  });
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

export function replaceLauncherListCommand(launchers) {
  return contextMenuLauncherCommand("replaceLauncherList", launchers);
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
  return Object.assign({}, newInstanceActionState(taskState), {
    command: newInstanceCommand(),
    text: "New Instance",
  });
}

export function moveCommand() {
  return contextMenuTaskCommand("requestMove");
}

export function resizeCommand() {
  return contextMenuTaskCommand("requestResize");
}

export function basicMoveAction(taskState) {
  return Object.assign({}, windowCapabilityActionState(taskState), {
    command: moveCommand(),
    text: "Move",
  });
}

export function basicResizeAction(taskState) {
  return Object.assign({}, windowCapabilityActionState(taskState), {
    command: resizeCommand(),
    text: "Resize",
  });
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
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: minimizeCommand(),
    text: "Minimize",
  });
}

export function maximizeAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: maximizeCommand(),
    text: "Maximize",
  });
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
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: keepAboveCommand(),
    text: "Keep Above Others",
  });
}

export function keepBelowAction(taskState) {
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: keepBelowCommand(),
    text: "Keep Below Others",
  });
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
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: fullscreenCommand(),
    text: "Fullscreen",
  });
}

export function shadeAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: shadeCommand(),
    text: "Shade",
  });
}

export function noBorderAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: noBorderCommand(),
    text: "No Border",
  });
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
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: excludeFromCaptureCommand(),
    text: "Hide from Screencasts",
  });
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
  return Object.assign({}, closeActionState(taskState), {
    command: closeCommand(),
    text: "Close",
  });
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
  return Object.assign({}, virtualDesktopsActionState(taskState), {
    text: "Virtual Desktops",
  });
}

export function newVirtualDesktopActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasWindowTask),
  };
}

export function newVirtualDesktopAction(taskState) {
  return Object.assign({}, newVirtualDesktopActionState(taskState), {
    command: newVirtualDesktopCommand(),
    text: "New Desktop",
  });
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
  return Object.assign({}, taskActivitiesActionState(taskState), {
    text: "Activities",
  });
}

export function closeActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.isWindow && state.closable),
  };
}

export function launcherActivitiesVisible(pinState, activityEntryCount) {
  const state = pinState || {};
  const count = Number(activityEntryCount || 0);
  return Boolean(
    state.canPin && state.isPinned && state.launcherUrl && count > 1,
  );
}

export function launcherActivitiesActionState(
  pinState,
  activityEntryCount,
  hasTaskModel,
) {
  const state = pinState || {};

  return {
    enabled: Boolean(hasTaskModel) && Boolean(state.canPin),
    visible: launcherActivitiesVisible(state, activityEntryCount),
  };
}

export function launcherActivitiesAction(
  pinState,
  activityEntryCount,
  hasTaskModel,
) {
  return Object.assign(
    {},
    launcherActivitiesActionState(pinState, activityEntryCount, hasTaskModel),
    {
      text: "Launcher Activities",
    },
  );
}

export function launcherActivityListSnapshot(launcherActivities) {
  return ActivityScopeLogic.normalizedActivityList(launcherActivities);
}

export function launcherActivityMenuState(launcherActivities, activityId) {
  const activities = launcherActivityListSnapshot(launcherActivities);
  const allActivitiesChecked = ActivityScopeLogic.activitiesAreAll(activities);

  return {
    activities,
    activityChecked:
      allActivitiesChecked ||
      ActivityScopeLogic.stringListContains(activities, activityId),
    allActivitiesChecked,
  };
}

export function launcherActivityUpdateCommand(
  launcherList,
  position,
  activities,
) {
  const update = launcherActivityUpdate(launcherList, position, activities);
  return Object.assign({}, update, {
    command:
      update.ok && update.changed
        ? replaceLauncherListCommand(update.launchers)
        : null,
  });
}

export function launcherAllActivitiesUpdateCommand(
  launcherList,
  position,
  launcherActivities,
  currentActivity,
) {
  const nextActivities = launcherActivitiesAfterAllToggle(
    launcherActivities,
    currentActivity,
  );
  if (!nextActivities) {
    return {
      activities: launcherActivityListSnapshot(launcherActivities),
      changed: false,
      command: null,
      launchers: normalizedLauncherList(launcherList),
      ok: false,
      reason: "missing-current-activity",
    };
  }

  return launcherActivityUpdateCommand(launcherList, position, nextActivities);
}

export function launcherActivityToggleUpdateCommand(
  launcherList,
  position,
  launcherActivities,
  activityId,
  currentActivity,
) {
  return launcherActivityUpdateCommand(
    launcherList,
    position,
    launcherActivitiesAfterToggle(
      launcherActivities,
      activityId,
      currentActivity,
    ),
  );
}

export function launcherAllActivitiesAction(
  launcherList,
  position,
  launcherActivities,
  currentActivity,
) {
  const activityState = launcherActivityMenuState(launcherActivities, "");

  return {
    checked: activityState.allActivitiesChecked,
    text: "All Activities",
    update: launcherAllActivitiesUpdateCommand(
      launcherList,
      position,
      launcherActivities,
      currentActivity,
    ),
  };
}

export function launcherActivityAction(
  launcherList,
  position,
  launcherActivities,
  activity,
  currentActivity,
) {
  const entry = activity || {};
  const activityState = launcherActivityMenuState(launcherActivities, entry.id);

  return {
    checked: activityState.activityChecked,
    text: entry.name,
    update: launcherActivityToggleUpdateCommand(
      launcherList,
      position,
      launcherActivities,
      entry.id,
      currentActivity,
    ),
  };
}

export function launcherActivityActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    activityAction: (activity) =>
      launcherActivityAction(
        state.launcherList,
        state.launcherPosition,
        state.launcherActivities,
        activity,
        state.currentActivity,
      ),
    allLauncherActivities: launcherAllActivitiesAction(
      state.launcherList,
      state.launcherPosition,
      state.launcherActivities,
      state.currentActivity,
    ),
    launcherActivities: launcherActivitiesAction(
      state.pinState,
      state.activityEntryCount,
      state.hasTaskModel,
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

export function virtualDesktopId(desktop) {
  if (!desktop) {
    return "";
  }

  if (typeof desktop === "string") {
    return desktop;
  }

  if (desktop.id) {
    return String(desktop.id);
  }

  return String(desktop);
}

export function virtualDesktopListContains(desktops, desktop) {
  const id = virtualDesktopId(desktop);
  if (!id) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  for (let i = 0; i < desktopList.length; ++i) {
    if (virtualDesktopId(desktopList[i]) === id) {
      return true;
    }
  }

  return false;
}

export function virtualDesktopMenuState(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
  const allDesktopsChecked = Boolean(isOnAllDesktops);

  return {
    allDesktopsChecked,
    desktopChecked:
      allDesktopsChecked ||
      virtualDesktopListContains(virtualDesktops, desktop),
  };
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

export function contextMenuActionRoute(actionState) {
  const state = actionState || {};
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

  const launcherActivityActions = launcherActivityActionsSection({
    activityEntryCount: state.activityEntryCount,
    currentActivity: state.currentActivity,
    hasTaskModel: state.hasTaskModel,
    launcherActivities: state.launcherActivities,
    launcherList: state.launcherList,
    launcherPosition: state.launcherPosition,
    pinState: state.pinState,
  });

  return {
    basicActions: basicActionsSection({
      canLaunchNewInstance: basicRoles.canLaunchNewInstance,
      hasTask: state.hasTask,
      hasWindowTask: state.hasWindowTask,
      isLauncher: basicRoles.isLauncher,
      isMovable: basicRoles.isMovable,
      isResizable: basicRoles.isResizable,
      isWindow: state.isWindow,
      launcherActivitiesVisible:
        launcherActivityActions.launcherActivities.visible,
    }),
    captureActions: captureActionsSection({
      hasWindowTask: state.hasWindowTask,
      isExcludedFromCapture: captureCloseRoles.isExcludedFromCapture,
      isWindow: state.isWindow,
    }),
    closeActions: closeActionsSection({
      closable: captureCloseRoles.closable,
      hasTask: state.hasTask,
      isWindow: state.isWindow,
    }),
    fullscreenShadeBorderActions: fullscreenShadeBorderActionsSection({
      canSetNoBorder: fullscreenShadeBorderRoles.canSetNoBorder,
      fullScreenable: fullscreenShadeBorderRoles.fullScreenable,
      hasNoBorder: fullscreenShadeBorderRoles.hasNoBorder,
      hasWindowTask: state.hasWindowTask,
      isFullScreen: fullscreenShadeBorderRoles.isFullScreen,
      isShadeable: fullscreenShadeBorderRoles.isShadeable,
      isShaded: fullscreenShadeBorderRoles.isShaded,
      isWindow: state.isWindow,
    }),
    keepAboveBelowActions: keepAboveBelowActionsSection({
      hasWindowTask: state.hasWindowTask,
      isKeepAbove: keepAboveBelowRoles.isKeepAbove,
      isKeepBelow: keepAboveBelowRoles.isKeepBelow,
      isWindow: state.isWindow,
    }),
    launcherActivityActions,
    minimizeMaximizeActions: minimizeMaximizeActionsSection({
      hasWindowTask: state.hasWindowTask,
      isMaximizable: minimizeMaximizeRoles.isMaximizable,
      isMaximized: minimizeMaximizeRoles.isMaximized,
      isMinimizable: minimizeMaximizeRoles.isMinimizable,
      isMinimized: minimizeMaximizeRoles.isMinimized,
      isWindow: state.isWindow,
    }),
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
}

export function roleData(roleSource, role, fallback) {
  const source = roleSource || {};
  if (
    !source.hasTask ||
    !source.taskModel ||
    source.modelIndex === undefined ||
    source.modelIndex === null ||
    role === undefined ||
    role === null ||
    typeof source.taskModel.data !== "function"
  ) {
    return fallback;
  }

  const value = source.taskModel.data(source.modelIndex, role);
  return value === undefined || value === null ? fallback : value;
}

export function boolRoleData(roleSource, role, fallback) {
  return Boolean(roleData(roleSource, role, fallback || false));
}

export function contextMenuRoleSnapshots(roleSource, roles, task) {
  return {
    basicActionRoles: basicActionRoleSnapshot(roleSource, roles, task),
    captureCloseRoles: captureCloseRoleSnapshot(roleSource, roles, task),
    fullscreenShadeBorderRoles: fullscreenShadeBorderRoleSnapshot(
      roleSource,
      roles,
      task,
    ),
    keepAboveBelowRoles: keepAboveBelowRoleSnapshot(roleSource, roles, task),
    minimizeMaximizeRoles: minimizeMaximizeRoleSnapshot(
      roleSource,
      roles,
      task,
    ),
    taskRoles: taskRoleSnapshot(roleSource, roles, task),
    virtualDesktopRoles: virtualDesktopRoleSnapshot(roleSource, roles, task),
  };
}

export function basicActionRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    canLaunchNewInstance: boolRoleData(
      roleSource,
      roleIds.CanLaunchNewInstance,
      fallback.canLaunchNewInstance || false,
    ),
    isLauncher: boolRoleData(
      roleSource,
      roleIds.IsLauncher,
      fallback.isLauncher || false,
    ),
    isMovable: boolRoleData(
      roleSource,
      roleIds.IsMovable,
      fallback.isMovable || false,
    ),
    isResizable: boolRoleData(
      roleSource,
      roleIds.IsResizable,
      fallback.isResizable || false,
    ),
  };
}

export function captureCloseRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    closable: boolRoleData(
      roleSource,
      roleIds.IsClosable,
      fallback.closable || false,
    ),
    isExcludedFromCapture: boolRoleData(
      roleSource,
      roleIds.IsExcludedFromCapture,
      fallback.isExcludedFromCapture || false,
    ),
  };
}

export function minimizeMaximizeRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    isMaximizable: boolRoleData(
      roleSource,
      roleIds.IsMaximizable,
      fallback.isMaximizable || false,
    ),
    isMaximized: boolRoleData(
      roleSource,
      roleIds.IsMaximized,
      fallback.isMaximized || false,
    ),
    isMinimizable: boolRoleData(
      roleSource,
      roleIds.IsMinimizable,
      fallback.isMinimizable || false,
    ),
    isMinimized: boolRoleData(
      roleSource,
      roleIds.IsMinimized,
      fallback.isMinimized || false,
    ),
  };
}

export function keepAboveBelowRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    isKeepAbove: boolRoleData(
      roleSource,
      roleIds.IsKeepAbove,
      fallback.isKeepAbove || false,
    ),
    isKeepBelow: boolRoleData(
      roleSource,
      roleIds.IsKeepBelow,
      fallback.isKeepBelow || false,
    ),
  };
}

export function fullscreenShadeBorderRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    canSetNoBorder: boolRoleData(
      roleSource,
      roleIds.CanSetNoBorder,
      fallback.canSetNoBorder || false,
    ),
    fullScreenable: boolRoleData(
      roleSource,
      roleIds.IsFullScreenable,
      fallback.fullScreenable || false,
    ),
    hasNoBorder: boolRoleData(
      roleSource,
      roleIds.HasNoBorder,
      fallback.hasNoBorder || false,
    ),
    isFullScreen: boolRoleData(
      roleSource,
      roleIds.IsFullScreen,
      fallback.isFullScreen || false,
    ),
    isShadeable: boolRoleData(
      roleSource,
      roleIds.IsShadeable,
      fallback.isShadeable || false,
    ),
    isShaded: boolRoleData(
      roleSource,
      roleIds.IsShaded,
      fallback.isShaded || false,
    ),
  };
}

export function virtualDesktopRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};

  return {
    isOnAllVirtualDesktops: boolRoleData(
      roleSource,
      roleIds.IsOnAllVirtualDesktops,
      fallback.isOnAllVirtualDesktops || false,
    ),
    isVirtualDesktopsChangeable: boolRoleData(
      roleSource,
      roleIds.IsVirtualDesktopsChangeable,
      fallback.isVirtualDesktopsChangeable || false,
    ),
  };
}

export function taskRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};
  const fallbackLauncherUrl = roleData(
    roleSource,
    roleIds.LauncherUrl,
    fallback.launcherUrl || "",
  );
  const launcherUrlWithoutIcon = roleData(
    roleSource,
    roleIds.LauncherUrlWithoutIcon,
    "",
  );

  return {
    activities: Array.from(
      roleData(roleSource, roleIds.Activities, fallback.activities || []) || [],
    ),
    isLauncher: boolRoleData(
      roleSource,
      roleIds.IsLauncher,
      fallback.isLauncher || false,
    ),
    isWindow: boolRoleData(
      roleSource,
      roleIds.IsWindow,
      fallback.isWindow || false,
    ),
    launcherUrl: launcherUrlFromRoles(
      launcherUrlWithoutIcon,
      fallbackLauncherUrl,
    ),
    virtualDesktops: Array.from(
      roleData(
        roleSource,
        roleIds.VirtualDesktops,
        fallback.virtualDesktops || [],
      ) || [],
    ),
  };
}
