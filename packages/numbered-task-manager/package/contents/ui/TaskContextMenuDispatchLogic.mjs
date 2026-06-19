// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";

export function contextMenuActionDispatchContext(route) {
  const actionRoute = route || {};
  const command = actionRoute.command || {};
  const update = actionRoute.update || {};
  const context = {
    routeKind: String(actionRoute.kind || ""),
  };

  if (command.action) {
    context.commandAction = String(command.action);
  }
  if (command.launcherUrl) {
    context.launcherUrl = String(command.launcherUrl);
  }
  if (command.requestMethod) {
    context.requestMethod = String(command.requestMethod);
  }
  if (update.reason) {
    context.reason = String(update.reason);
  }

  return context;
}

export function contextMenuActionDispatchFailure(route, code) {
  return actionResult(
    "dispatchContextMenuAction",
    code || "dispatch-failed",
    false,
    true,
    contextMenuActionDispatchContext(route),
  );
}

export function contextMenuLauncherActivityContext(update, launcherUrl) {
  const activityUpdate = update || {};
  const context = {};
  const url = String(launcherUrl || "");

  if (url) {
    context.launcherUrl = url;
  }
  if (activityUpdate.changed !== undefined) {
    context.changed = Boolean(activityUpdate.changed);
  }
  if (activityUpdate.reason) {
    context.reason = String(activityUpdate.reason);
  }

  return context;
}

export function contextMenuLauncherActivityResult(update, code, launcherUrl) {
  return actionResult(
    "updateLauncherActivities",
    code || "launcher-activity-update-failed",
    false,
    true,
    contextMenuLauncherActivityContext(update, launcherUrl),
  );
}
