// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("ActivityScopeLogic.js");

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

function pinActionState(pinState) {
  const state = pinState || {};
  const isPinned = Boolean(state.isPinned);

  return {
    action: isPinned ? "unpin" : "pin",
    enabled: Boolean(state.canPin),
    text: isPinned ? "Unpin from Task Manager" : "Pin to Task Manager",
  };
}

function newInstanceActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.canLaunchNewInstance || state.isLauncher),
  };
}

function windowCapabilityActionState(taskState) {
  const state = taskState || {};
  const capable = Boolean(state.capable);

  return {
    enabled: Boolean(state.hasWindowTask && capable),
    visible: Boolean(state.isWindow && capable),
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

function taskRoleSnapshot(roleSource, roles, task) {
  const roleIds = roles || {};
  const fallback = task || {};
  const fallbackLauncherUrl = roleData(
    roleSource,
    roleIds.LauncherUrl,
    fallback.launcherUrl || "",
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
    launcherUrl: String(
      roleData(
        roleSource,
        roleIds.LauncherUrlWithoutIcon,
        fallbackLauncherUrl,
      ) || "",
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
