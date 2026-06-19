// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { launcherUrlFromRoles } from "./TaskEntryLogic.mjs";

export function roleData(roleSource, role, fallback) {
  const source = roleSource || {};
  if (
    !source.hasTask ||
    !source.rolePort ||
    source.modelIndex === undefined ||
    source.modelIndex === null ||
    role === undefined ||
    role === null ||
    typeof source.rolePort.data !== "function"
  ) {
    return fallback;
  }

  const value = source.rolePort.data(source.modelIndex, role);
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
