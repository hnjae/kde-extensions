// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function desktopId(desktop) {
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

export function desktopListContains(desktops, desktop) {
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

export function isOnCurrentVirtualDesktop(
  desktops,
  isOnAllDesktops,
  currentDesktop,
) {
  if (isOnAllDesktops) {
    return true;
  }

  return desktopListContains(desktops, currentDesktop);
}

export function isRemoteVirtualDesktop(
  desktops,
  isOnAllDesktops,
  currentDesktop,
) {
  if (isOnAllDesktops) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  return (
    desktopList.length > 0 && !desktopListContains(desktopList, currentDesktop)
  );
}

export function hasValidModelIndex(modelIndex) {
  return isActionableModelIndex(modelIndex);
}

export function modelIndexState(modelIndex) {
  if (!modelIndex) {
    return "missing";
  }

  if (modelIndex.valid === undefined) {
    return "unknown-shape";
  }

  return modelIndex.valid ? "valid" : "invalid";
}

export function isActionableModelIndexState(state) {
  return state === "valid" || state === "unknown-shape";
}

export function isActionableModelIndex(modelIndex) {
  return isActionableModelIndexState(modelIndexState(modelIndex));
}

export function taskEntryDiagnostic(code, field, context) {
  return {
    code,
    context: Object.assign({}, context || {}),
    field,
  };
}

export function isBooleanRoleValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  return typeof value === "boolean";
}

export function isListRoleValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return false;
  }

  if (Array.isArray(value)) {
    return true;
  }

  if (typeof value !== "object") {
    return false;
  }

  if (value.length === undefined || value.length === null) {
    return false;
  }

  const listLength = Number(value.length);
  return Number.isInteger(listLength) && listLength >= 0;
}

export function taskEntryDiagnostics(roles, context) {
  const taskRoles = roles || {};
  const diagnostics = [];
  const modelIndex = taskRoles.modelIndex;

  if (
    taskRoles.index !== undefined &&
    taskRoles.index !== null &&
    Number.isNaN(Number(taskRoles.index))
  ) {
    diagnostics.push(taskEntryDiagnostic("invalid-number", "index", context));
  }

  const baseBooleanRoleFields = [
    "demandingAttention",
    "isOnAllVirtualDesktops",
    "isLauncher",
    "isWindow",
  ];
  for (let i = 0; i < baseBooleanRoleFields.length; ++i) {
    const field = baseBooleanRoleFields[i];
    if (!isBooleanRoleValue(taskRoles[field])) {
      diagnostics.push(taskEntryDiagnostic("invalid-boolean", field, context));
    }
  }

  if (!isListRoleValue(taskRoles.activities)) {
    diagnostics.push(
      taskEntryDiagnostic("invalid-list", "activities", context),
    );
  }

  const indexState = modelIndexState(modelIndex);
  if (indexState === "missing") {
    diagnostics.push(
      taskEntryDiagnostic("missing-model-index", "modelIndex", context),
    );
  } else if (indexState === "unknown-shape") {
    diagnostics.push(
      taskEntryDiagnostic("unknown-model-index-shape", "modelIndex", context),
    );
  } else if (indexState === "invalid") {
    diagnostics.push(
      taskEntryDiagnostic("invalid-model-index", "modelIndex", context),
    );
  }

  if (!isListRoleValue(taskRoles.virtualDesktops)) {
    diagnostics.push(
      taskEntryDiagnostic("invalid-list", "virtualDesktops", context),
    );
  }

  return diagnostics;
}

export function boolValue(value) {
  return Boolean(value);
}

export function stringValue(value) {
  return String(value || "");
}

export function normalTaskIconFallback() {
  return "application-x-executable";
}

export function remoteAttentionIconFallback() {
  return "dialog-warning";
}

export function launcherUrlFromRoles(launcherUrlWithoutIcon, launcherUrl) {
  return stringValue(launcherUrlWithoutIcon || launcherUrl);
}

export function numberValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? fallback : numericValue;
}

export function taskTitle(display, appName) {
  return stringValue(display || appName);
}

export function taskIconSource(decoration, fallback) {
  return decoration || fallback;
}

export function createBaseTaskEntry(roles, iconFallback) {
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
