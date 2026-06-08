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

function taskEntryDiagnostic(code, field, context) {
  return {
    code,
    context: Object.assign({}, context || {}),
    field,
  };
}

function isBooleanRoleValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  return typeof value === "boolean";
}

function isListRoleValue(value) {
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

function taskEntryDiagnostics(roles, context) {
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

  if (!modelIndex) {
    diagnostics.push(
      taskEntryDiagnostic("missing-model-index", "modelIndex", context),
    );
  } else if (modelIndex.valid === undefined) {
    diagnostics.push(
      taskEntryDiagnostic("unknown-model-index-shape", "modelIndex", context),
    );
  } else if (!modelIndex.valid) {
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

function boolValue(value) {
  return Boolean(value);
}

function stringValue(value) {
  return String(value || "");
}

function normalTaskIconFallback() {
  return "application-x-executable";
}

function remoteAttentionIconFallback() {
  return "dialog-warning";
}

function launcherUrlFromRoles(launcherUrlWithoutIcon, launcherUrl) {
  return stringValue(launcherUrlWithoutIcon || launcherUrl);
}

function numberValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? fallback : numericValue;
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
