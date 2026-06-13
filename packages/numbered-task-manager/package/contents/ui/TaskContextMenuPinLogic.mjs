// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { contextMenuLauncherCommand } from "./TaskActionLogic.mjs";
import { launcherPinState } from "./LauncherListLogic.mjs";

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
}

export function pinActionState(pinState) {
  const state = pinState || {};
  const isPinned = Boolean(state.isPinned);

  return {
    action: isPinned ? "unpin" : "pin",
    enabled: Boolean(state.canPin),
    text: isPinned ? "Unpin from Task Manager" : "Pin to Task Manager",
  };
}

export function pinLauncherCommand(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);
  return contextMenuLauncherCommand(
    action.action === "unpin" ? "unpinLauncher" : "pinLauncher",
    state.launcherUrl,
  );
}

export function pinLauncherAction(pinState) {
  const state = pinState || {};
  const action = pinActionState(state);

  return actionWithIcon(
    Object.assign({}, action, {
      command: pinLauncherCommand(state),
    }),
    action.action === "unpin" ? "window-unpin" : "window-pin",
  );
}

export function pinActionsSection(sectionState) {
  return {
    pinLauncher: pinLauncherAction(sectionState),
  };
}

export function launcherPinStateSnapshot(
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
