// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskActionLogic.js");
Qt.include("TaskActivityLogic.js");
Qt.include("TaskEntryLogic.js");
Qt.include("LauncherListLogic.js");

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

function pinLauncherAction(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);

  return Object.assign({}, action, {
    command: pinLauncherCommand(state),
  });
}

function launcherPinStateSnapshot(
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

function replaceLauncherListCommand(launchers) {
  return contextMenuLauncherCommand("replaceLauncherList", launchers);
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

function newInstanceAction(taskState) {
  return Object.assign({}, newInstanceActionState(taskState), {
    command: newInstanceCommand(),
    text: "New Instance",
  });
}

function moveCommand() {
  return contextMenuTaskCommand("requestMove");
}

function resizeCommand() {
  return contextMenuTaskCommand("requestResize");
}

function basicMoveAction(taskState) {
  return Object.assign({}, windowCapabilityActionState(taskState), {
    command: moveCommand(),
    text: "Move",
  });
}

function basicResizeAction(taskState) {
  return Object.assign({}, windowCapabilityActionState(taskState), {
    command: resizeCommand(),
    text: "Resize",
  });
}

function basicActionsSection(sectionState) {
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

function minimizeCommand() {
  return contextMenuTaskCommand("requestToggleMinimized");
}

function maximizeCommand() {
  return contextMenuTaskCommand("requestToggleMaximized");
}

function minimizeAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: minimizeCommand(),
    text: "Minimize",
  });
}

function maximizeAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: maximizeCommand(),
    text: "Maximize",
  });
}

function minimizeMaximizeActionsSection(sectionState) {
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

function keepAboveCommand() {
  return contextMenuTaskCommand("requestToggleKeepAbove");
}

function keepBelowCommand() {
  return contextMenuTaskCommand("requestToggleKeepBelow");
}

function keepAboveAction(taskState) {
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: keepAboveCommand(),
    text: "Keep Above Others",
  });
}

function keepBelowAction(taskState) {
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: keepBelowCommand(),
    text: "Keep Below Others",
  });
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

function fullscreenAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: fullscreenCommand(),
    text: "Fullscreen",
  });
}

function shadeAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: shadeCommand(),
    text: "Shade",
  });
}

function noBorderAction(taskState) {
  return Object.assign({}, checkableWindowCapabilityActionState(taskState), {
    command: noBorderCommand(),
    text: "No Border",
  });
}

function excludeFromCaptureCommand() {
  return contextMenuTaskCommand("requestToggleExcludeFromCapture");
}

function closeCommand() {
  return contextMenuTaskCommand("requestClose");
}

function excludeFromCaptureAction(taskState) {
  return Object.assign({}, checkableWindowActionState(taskState), {
    command: excludeFromCaptureCommand(),
    text: "Hide from Screencasts",
  });
}

function closeAction(taskState) {
  return Object.assign({}, closeActionState(taskState), {
    command: closeCommand(),
    text: "Close",
  });
}

function closeActionSection(closeActionState) {
  const state = closeActionState || {};
  return {
    visible: Boolean(state.visible),
  };
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

function menuActionSection(sectionState) {
  return {
    visible: menuActionSectionVisible(sectionState),
  };
}

function virtualDesktopsActionState(taskState) {
  const state = taskState || {};
  return windowCapabilityActionState(
    Object.assign({}, state, {
      capable: state.changeable,
    }),
  );
}

function virtualDesktopsAction(taskState) {
  return Object.assign({}, virtualDesktopsActionState(taskState), {
    text: "Virtual Desktops",
  });
}

function newVirtualDesktopActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasWindowTask),
  };
}

function newVirtualDesktopAction(taskState) {
  return Object.assign({}, newVirtualDesktopActionState(taskState), {
    command: newVirtualDesktopCommand(),
    text: "New Desktop",
  });
}

function taskActivitiesActionState(taskState) {
  const state = taskState || {};
  const activityEntryCount = Number(state.activityEntryCount || 0);

  return {
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow && activityEntryCount > 1),
  };
}

function taskActivitiesAction(taskState) {
  return Object.assign({}, taskActivitiesActionState(taskState), {
    text: "Activities",
  });
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

function launcherActivitiesActionState(
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

function launcherActivitiesAction(pinState, activityEntryCount, hasTaskModel) {
  return Object.assign(
    {},
    launcherActivitiesActionState(pinState, activityEntryCount, hasTaskModel),
    {
      text: "Launcher Activities",
    },
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

function launcherActivityUpdateCommand(launcherList, position, activities) {
  const update = launcherActivityUpdate(launcherList, position, activities);
  return Object.assign({}, update, {
    command:
      update.ok && update.changed
        ? replaceLauncherListCommand(update.launchers)
        : null,
  });
}

function launcherAllActivitiesUpdateCommand(
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

function launcherActivityToggleUpdateCommand(
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

function launcherAllActivitiesAction(
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

function launcherActivityAction(
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

function allTaskActivitiesAction(taskActivities) {
  const activityState = taskActivityMenuState(taskActivities, "");

  return {
    checked: activityState.allActivitiesChecked,
    command: allTaskActivitiesCommand(),
    text: "All Activities",
  };
}

function taskActivityAction(taskActivities, activity) {
  const entry = activity || {};
  const activityState = taskActivityMenuState(taskActivities, entry.id);

  return {
    checked: activityState.activityChecked,
    command: taskActivityToggleCommand(taskActivities, entry.id),
    text: entry.name,
  };
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

function allVirtualDesktopsAction(virtualDesktops, isOnAllDesktops) {
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

function virtualDesktopAction(virtualDesktops, isOnAllDesktops, desktop) {
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
