// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { contextMenuTaskCommand } from "./TaskActionLogic.mjs";
import * as VirtualDesktopLogic from "./VirtualDesktopLogic.mjs";
import * as WindowActionLogic from "./TaskContextMenuWindowActionLogic.mjs";

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
}

export function virtualDesktopsActionState(taskState) {
  const state = taskState || {};
  return WindowActionLogic.windowCapabilityActionState(
    Object.assign({}, state, {
      capable: state.changeable,
    }),
  );
}

export function virtualDesktopsAction(taskState) {
  return actionWithIcon(
    Object.assign({}, virtualDesktopsActionState(taskState), {
      text: "Move to Desktop",
    }),
    "virtual-desktops",
  );
}

export function newVirtualDesktopActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasWindowTask),
  };
}

export function newVirtualDesktopAction(taskState) {
  return actionWithIcon(
    Object.assign({}, newVirtualDesktopActionState(taskState), {
      command: newVirtualDesktopCommand(),
      text: "New Desktop",
    }),
    "list-add",
  );
}

export function virtualDesktopMenuState(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
  return VirtualDesktopLogic.virtualDesktopMenuState(
    virtualDesktops,
    isOnAllDesktops,
    desktop,
  );
}

export function allVirtualDesktopsCommand() {
  return contextMenuTaskCommand("requestVirtualDesktops", []);
}

export function virtualDesktopCommand(desktopId) {
  return contextMenuTaskCommand("requestVirtualDesktops", [desktopId]);
}

export function newVirtualDesktopCommand() {
  return contextMenuTaskCommand("requestNewVirtualDesktop");
}

export function allVirtualDesktopsAction(virtualDesktops, isOnAllDesktops) {
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

export function virtualDesktopAction(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
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

export function virtualDesktopActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    allVirtualDesktops: allVirtualDesktopsAction(
      state.virtualDesktops,
      state.isOnAllVirtualDesktops,
    ),
    desktopAction: (desktop) =>
      virtualDesktopAction(
        state.virtualDesktops,
        state.isOnAllVirtualDesktops,
        desktop,
      ),
    newVirtualDesktop: newVirtualDesktopAction({
      hasWindowTask: state.hasWindowTask,
    }),
    virtualDesktops: virtualDesktopsAction({
      changeable: state.changeable,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}
