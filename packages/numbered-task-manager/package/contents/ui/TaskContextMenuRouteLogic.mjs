// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export const CONTEXT_MENU_LAUNCHER_COMMAND_KIND = "launcher-command";
export const CONTEXT_MENU_TASK_MODEL_REQUEST_KIND = "task-model-request";

export const CONTEXT_MENU_ROUTE_UNAVAILABLE = "unavailable";
export const CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE =
  "launcher-activity-update";
export const CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND =
  CONTEXT_MENU_LAUNCHER_COMMAND_KIND;
export const CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST =
  CONTEXT_MENU_TASK_MODEL_REQUEST_KIND;
export const CONTEXT_MENU_ROUTE_NONE = "none";

function unavailableActionRoute(actionState) {
  const state = actionState || {};
  const code = state.visible === false ? "action-hidden" : "action-disabled";

  return {
    code,
    command: state.command || null,
    kind: CONTEXT_MENU_ROUTE_UNAVAILABLE,
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
      kind: CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE,
      update: state.update,
    };
  }

  const command = state.command || null;
  if (!command) {
    return {
      command: null,
      kind: CONTEXT_MENU_ROUTE_NONE,
      update: null,
    };
  }

  if (command.kind === CONTEXT_MENU_LAUNCHER_COMMAND_KIND) {
    return {
      command,
      kind: CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND,
      update: null,
    };
  }

  return {
    command,
    kind: CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST,
    update: null,
  };
}

export function isUnavailableRoute(route) {
  return Boolean(route && route.kind === CONTEXT_MENU_ROUTE_UNAVAILABLE);
}

export function isLauncherActivityUpdateRoute(route) {
  return Boolean(
    route && route.kind === CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE,
  );
}

export function isLauncherCommandRoute(route) {
  return Boolean(route && route.kind === CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND);
}

export function isTaskModelRequestRoute(route) {
  return Boolean(route && route.kind === CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST);
}

export function isNoneRoute(route) {
  return Boolean(route && route.kind === CONTEXT_MENU_ROUTE_NONE);
}
