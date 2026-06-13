// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { contextMenuTaskCommand } from "./TaskActionLogic.mjs";

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
}

export function newInstanceActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.canLaunchNewInstance || state.isLauncher),
  };
}

export function newInstanceCommand() {
  return contextMenuTaskCommand("requestNewInstance");
}

export function newInstanceAction(taskState) {
  return actionWithIcon(
    Object.assign({}, newInstanceActionState(taskState), {
      command: newInstanceCommand(),
      text: "New Instance",
    }),
    "window-new",
  );
}

export function moveCommand() {
  return contextMenuTaskCommand("requestMove");
}

export function resizeCommand() {
  return contextMenuTaskCommand("requestResize");
}

export function basicMoveAction(taskState) {
  return actionWithIcon(
    Object.assign({}, windowCapabilityActionState(taskState), {
      command: moveCommand(),
      text: "Move",
    }),
    "transform-move",
  );
}

export function basicResizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, windowCapabilityActionState(taskState), {
      command: resizeCommand(),
      text: "Resize",
    }),
    "transform-scale",
  );
}

export function basicActionsSection(sectionState) {
  const state = sectionState || {};
  const newInstance = newInstanceAction({
    canLaunchNewInstance: state.canLaunchNewInstance,
    hasTask: state.hasTask,
    isLauncher: state.isLauncher,
  });
  const move = basicMoveAction({
    capable: state.isMovable,
    hasWindowTask: state.hasWindowTask,
    isWindow: state.isWindow,
  });
  const resize = basicResizeAction({
    capable: state.isResizable,
    hasWindowTask: state.hasWindowTask,
    isWindow: state.isWindow,
  });

  return {
    move,
    newInstance,
    resize,
    separator: menuActionSection({
      hasWindowTask: state.hasWindowTask,
      launcherActivitiesVisible: state.launcherActivitiesVisible,
      newInstanceVisible: newInstance.visible,
    }),
  };
}

export function minimizeCommand() {
  return contextMenuTaskCommand("requestToggleMinimized");
}

export function maximizeCommand() {
  return contextMenuTaskCommand("requestToggleMaximized");
}

export function minimizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: minimizeCommand(),
      text: "Minimize",
    }),
    "window-minimize",
  );
}

export function maximizeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: maximizeCommand(),
      text: "Maximize",
    }),
    "window-maximize",
  );
}

export function minimizeMaximizeActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    maximize: maximizeAction({
      capable: state.isMaximizable,
      checked: state.isMaximized,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    minimize: minimizeAction({
      capable: state.isMinimizable,
      checked: state.isMinimized,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function keepAboveCommand() {
  return contextMenuTaskCommand("requestToggleKeepAbove");
}

export function keepBelowCommand() {
  return contextMenuTaskCommand("requestToggleKeepBelow");
}

export function keepAboveAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: keepAboveCommand(),
      text: "Keep Above Others",
    }),
    "window-keep-above",
  );
}

export function keepBelowAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: keepBelowCommand(),
      text: "Keep Below Others",
    }),
    "window-keep-below",
  );
}

export function keepAboveBelowActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    keepAbove: keepAboveAction({
      checked: state.isKeepAbove,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    keepBelow: keepBelowAction({
      checked: state.isKeepBelow,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function fullscreenCommand() {
  return contextMenuTaskCommand("requestToggleFullScreen");
}

export function shadeCommand() {
  return contextMenuTaskCommand("requestToggleShaded");
}

export function noBorderCommand() {
  return contextMenuTaskCommand("requestToggleNoBorder");
}

export function fullscreenAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: fullscreenCommand(),
      text: "Fullscreen",
    }),
    "view-fullscreen",
  );
}

export function shadeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: shadeCommand(),
      text: "Shade",
    }),
    "window-shade",
  );
}

export function noBorderAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowCapabilityActionState(taskState), {
      command: noBorderCommand(),
      text: "No Border",
    }),
    "edit-none-border",
  );
}

export function fullscreenShadeBorderActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    fullscreen: fullscreenAction({
      capable: state.fullScreenable,
      checked: state.isFullScreen,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    noBorder: noBorderAction({
      capable: state.canSetNoBorder,
      checked: state.hasNoBorder,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    shade: shadeAction({
      capable: state.isShadeable,
      checked: state.isShaded,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function excludeFromCaptureCommand() {
  return contextMenuTaskCommand("requestToggleExcludeFromCapture");
}

export function closeCommand() {
  return contextMenuTaskCommand("requestClose");
}

export function excludeFromCaptureAction(taskState) {
  return actionWithIcon(
    Object.assign({}, checkableWindowActionState(taskState), {
      command: excludeFromCaptureCommand(),
      text: "Hide from Screencasts",
    }),
    "view-private",
  );
}

export function captureActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    excludeFromCapture: excludeFromCaptureAction({
      checked: state.isExcludedFromCapture,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}

export function closeAction(taskState) {
  return actionWithIcon(
    Object.assign({}, closeActionState(taskState), {
      command: closeCommand(),
      text: "Close",
    }),
    "window-close",
  );
}

export function closeActionSection(closeActionState) {
  const state = closeActionState || {};
  return {
    visible: Boolean(state.visible),
  };
}

export function closeActionsSection(sectionState) {
  const close = closeAction(sectionState);

  return {
    close,
    separator: closeActionSection(close),
  };
}

export function closeActionState(taskState) {
  const state = taskState || {};

  return {
    enabled: Boolean(state.hasTask),
    visible: Boolean(state.isWindow && state.closable),
  };
}

export function windowCapabilityActionState(taskState) {
  const state = taskState || {};
  const capable = Boolean(state.capable);

  return {
    enabled: Boolean(state.hasWindowTask && capable),
    visible: Boolean(state.isWindow && capable),
  };
}

export function checkableWindowCapabilityActionState(taskState) {
  const state = taskState || {};
  const actionState = windowCapabilityActionState(state);

  return Object.assign({}, actionState, {
    checked: Boolean(state.checked),
  });
}

export function checkableWindowActionState(taskState) {
  const state = taskState || {};

  return {
    checked: Boolean(state.checked),
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow),
  };
}

export function menuActionSectionVisible(sectionState) {
  const state = sectionState || {};
  return Boolean(
    state.launcherActivitiesVisible ||
      state.newInstanceVisible ||
      state.hasWindowTask,
  );
}

export function menuActionSection(sectionState) {
  return {
    visible: menuActionSectionVisible(sectionState),
  };
}

export function moreActionsSection(sectionState) {
  const state = sectionState || {};
  const actions = Array.from(state.actions || []);
  const visible = actions.some((action) => Boolean(action?.visible));

  return {
    moreActions: actionWithIcon(
      {
        enabled: visible,
        text: "More",
        visible,
      },
      "view-more-symbolic",
    ),
  };
}
