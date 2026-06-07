// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskActionLogic.js");
Qt.include("TaskActivityLogic.js");
Qt.include("TaskEntryLogic.js");

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

function virtualDesktopEntriesSnapshot(desktopIds, desktopNames) {
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

function activityEntriesSnapshot(activityIds, activityName, activityIcon) {
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

function pinActionState(pinState) {
  const state = pinState || {};
  const isPinned = Boolean(state.isPinned);

  return {
    action: isPinned ? "unpin" : "pin",
    enabled: Boolean(state.canPin),
    text: isPinned ? "Unpin from Task Manager" : "Pin to Task Manager",
  };
}

function pinLauncherCommand(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);
  return contextMenuLauncherCommand(
    action.action === "unpin" ? "unpinLauncher" : "pinLauncher",
    state.launcherUrl,
  );
}

function newInstanceActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.canLaunchNewInstance || state.isLauncher),
  };
}

function newInstanceCommand() {
  return contextMenuTaskCommand("requestNewInstance");
}

function moveCommand() {
  return contextMenuTaskCommand("requestMove");
}

function resizeCommand() {
  return contextMenuTaskCommand("requestResize");
}

function minimizeCommand() {
  return contextMenuTaskCommand("requestToggleMinimized");
}

function maximizeCommand() {
  return contextMenuTaskCommand("requestToggleMaximized");
}

function keepAboveCommand() {
  return contextMenuTaskCommand("requestToggleKeepAbove");
}

function keepBelowCommand() {
  return contextMenuTaskCommand("requestToggleKeepBelow");
}

function fullscreenCommand() {
  return contextMenuTaskCommand("requestToggleFullScreen");
}

function shadeCommand() {
  return contextMenuTaskCommand("requestToggleShaded");
}

function noBorderCommand() {
  return contextMenuTaskCommand("requestToggleNoBorder");
}

function excludeFromCaptureCommand() {
  return contextMenuTaskCommand("requestToggleExcludeFromCapture");
}

function closeCommand() {
  return contextMenuTaskCommand("requestClose");
}

function allTaskActivitiesCommand() {
  return contextMenuTaskCommand("requestActivities", []);
}

function windowCapabilityActionState(taskState) {
  const state = taskState || {};
  const capable = Boolean(state.capable);

  return {
    enabled: Boolean(state.hasWindowTask && capable),
    visible: Boolean(state.isWindow && capable),
  };
}

function checkableWindowCapabilityActionState(taskState) {
  const state = taskState || {};
  const actionState = windowCapabilityActionState(state);

  return Object.assign({}, actionState, {
    checked: Boolean(state.checked),
  });
}

function checkableWindowActionState(taskState) {
  const state = taskState || {};

  return {
    checked: Boolean(state.checked),
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow),
  };
}

function menuActionSectionVisible(sectionState) {
  const state = sectionState || {};
  return Boolean(
    state.launcherActivitiesVisible ||
      state.newInstanceVisible ||
      state.hasWindowTask,
  );
}

function virtualDesktopsActionState(taskState) {
  const state = taskState || {};
  return windowCapabilityActionState(
    Object.assign({}, state, {
      capable: state.changeable,
    }),
  );
}

function newVirtualDesktopActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasWindowTask),
  };
}

function taskActivitiesActionState(taskState) {
  const state = taskState || {};
  const activityEntryCount = Number(state.activityEntryCount || 0);

  return {
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow && activityEntryCount > 1),
  };
}

function closeActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.isWindow && state.closable),
  };
}

function launcherActivitiesVisible(pinState, activityEntryCount) {
  const state = pinState || {};
  const count = Number(activityEntryCount || 0);
  return Boolean(
    state.canPin && state.isPinned && state.launcherUrl && count > 1,
  );
}

function launcherActivityListSnapshot(launcherActivities) {
  return ActivityScopeLogic.normalizedActivityList(launcherActivities);
}

function launcherActivityMenuState(launcherActivities, activityId) {
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

function taskActivityMenuState(taskActivities, activityId) {
  const activities = Array.from(taskActivities || []);
  const allActivitiesChecked = ActivityScopeLogic.activitiesAreAll(activities);

  return {
    activityChecked:
      allActivitiesChecked ||
      ActivityScopeLogic.stringListContains(activities, activityId),
    allActivitiesChecked,
  };
}

function taskActivityToggleCommand(taskActivities, activityId) {
  return contextMenuTaskCommand(
    "requestActivities",
    taskActivitiesAfterToggle(taskActivities, activityId),
  );
}

function virtualDesktopId(desktop) {
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

function virtualDesktopListContains(desktops, desktop) {
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

function virtualDesktopMenuState(virtualDesktops, isOnAllDesktops, desktop) {
  const allDesktopsChecked = Boolean(isOnAllDesktops);

  return {
    allDesktopsChecked,
    desktopChecked:
      allDesktopsChecked ||
      virtualDesktopListContains(virtualDesktops, desktop),
  };
}

function allVirtualDesktopsCommand() {
  return contextMenuTaskCommand("requestVirtualDesktops", []);
}

function virtualDesktopCommand(desktopId) {
  return contextMenuTaskCommand("requestVirtualDesktops", [desktopId]);
}

function newVirtualDesktopCommand() {
  return contextMenuTaskCommand("requestNewVirtualDesktop");
}

function roleData(roleSource, role, fallback) {
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

function boolRoleData(roleSource, role, fallback) {
  return Boolean(roleData(roleSource, role, fallback || false));
}

function basicActionRoleSnapshot(roleSource, roles, task) {
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

function captureCloseRoleSnapshot(roleSource, roles, task) {
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

function minimizeMaximizeRoleSnapshot(roleSource, roles, task) {
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

function keepAboveBelowRoleSnapshot(roleSource, roles, task) {
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

function fullscreenShadeBorderRoleSnapshot(roleSource, roles, task) {
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

function virtualDesktopRoleSnapshot(roleSource, roles, task) {
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

function taskRoleSnapshot(roleSource, roles, task) {
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
