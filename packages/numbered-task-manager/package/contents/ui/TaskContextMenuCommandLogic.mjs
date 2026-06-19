// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CONTEXT_MENU_LAUNCHER_COMMAND_KIND,
  CONTEXT_MENU_TASK_MODEL_REQUEST_KIND,
} from "./TaskContextMenuRouteLogic.mjs";

function normalizedStringList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter((entry) => entry && entry.length > 0);
}

export function contextMenuLauncherCommand(action, value) {
  const commandAction = String(action || "");
  const command = {
    action: commandAction,
    kind: CONTEXT_MENU_LAUNCHER_COMMAND_KIND,
    launcherUrl: "",
    launchers: [],
  };

  if (commandAction === "replaceLauncherList") {
    command.launchers = normalizedStringList(value);
    return command;
  }

  command.launcherUrl = String(value || "");
  return command;
}

export function normalizedContextMenuLauncherCommand(command) {
  const launcherCommand = command || {};
  if (launcherCommand.action === "replaceLauncherList") {
    return contextMenuLauncherCommand(
      launcherCommand.action,
      launcherCommand.launchers,
    );
  }

  return contextMenuLauncherCommand(
    launcherCommand.action,
    launcherCommand.launcherUrl,
  );
}

export function contextMenuTaskCommand(requestMethod, argument) {
  const command = {
    arguments: [],
    kind: CONTEXT_MENU_TASK_MODEL_REQUEST_KIND,
    requestMethod: String(requestMethod || ""),
  };

  if (argument !== undefined) {
    command.arguments = [argument];
  }

  return command;
}

export function normalizedContextMenuTaskCommand(command) {
  if (typeof command === "string") {
    return contextMenuTaskCommand(command);
  }

  const taskCommand = command || {};
  return {
    arguments: Array.from(taskCommand.arguments || []),
    kind: taskCommand.kind || CONTEXT_MENU_TASK_MODEL_REQUEST_KIND,
    requestMethod: String(taskCommand.requestMethod || ""),
  };
}
