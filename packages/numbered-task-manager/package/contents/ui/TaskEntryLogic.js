// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function desktopId(desktop) {
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

function desktopListContains(desktops, desktop) {
  const currentDesktopId = desktopId(desktop);
  if (!currentDesktopId) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  for (let i = 0; i < desktopList.length; ++i) {
    if (desktopId(desktopList[i]) === currentDesktopId) {
      return true;
    }
  }

  return false;
}

function isOnCurrentVirtualDesktop(desktops, isOnAllDesktops, currentDesktop) {
  if (isOnAllDesktops) {
    return true;
  }

  return desktopListContains(desktops, currentDesktop);
}

function isRemoteVirtualDesktop(desktops, isOnAllDesktops, currentDesktop) {
  if (isOnAllDesktops) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  return (
    desktopList.length > 0 && !desktopListContains(desktopList, currentDesktop)
  );
}

function hasValidModelIndex(modelIndex) {
  return (
    Boolean(modelIndex) && (modelIndex.valid === undefined || modelIndex.valid)
  );
}

function boolValue(value) {
  return Boolean(value);
}

function stringValue(value) {
  return String(value || "");
}

function numberValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const numericValue = Number(value);
  return isNaN(numericValue) ? fallback : numericValue;
}

function taskTitle(display, appName) {
  return stringValue(display || appName);
}

function taskIconSource(decoration, fallback) {
  return decoration || fallback;
}

function createBaseTaskEntry(roles, iconFallback) {
  const taskRoles = roles || {};
  const index = numberValue(taskRoles.index, -1);

  return {
    activities: Array.from(taskRoles.activities || []),
    demandingAttention: boolValue(taskRoles.demandingAttention),
    iconSource: taskIconSource(taskRoles.iconSource, iconFallback),
    index,
    isOnAllVirtualDesktops: boolValue(taskRoles.isOnAllVirtualDesktops),
    isWindow: boolValue(taskRoles.isWindow),
    launcherUrl: stringValue(taskRoles.launcherUrl),
    modelIndex: taskRoles.modelIndex,
    title: taskTitle(taskRoles.display, taskRoles.appName),
    virtualDesktops: Array.from(taskRoles.virtualDesktops || []),
  };
}
