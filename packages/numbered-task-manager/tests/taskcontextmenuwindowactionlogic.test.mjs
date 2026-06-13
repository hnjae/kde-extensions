// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const exportNames = [
  "basicActionsSection",
  "basicMoveAction",
  "basicResizeAction",
  "captureActionsSection",
  "checkableWindowActionState",
  "checkableWindowCapabilityActionState",
  "closeAction",
  "closeActionSection",
  "closeActionState",
  "closeActionsSection",
  "closeCommand",
  "excludeFromCaptureAction",
  "excludeFromCaptureCommand",
  "fullscreenAction",
  "fullscreenCommand",
  "fullscreenShadeBorderActionsSection",
  "keepAboveAction",
  "keepAboveBelowActionsSection",
  "keepAboveCommand",
  "keepBelowAction",
  "keepBelowCommand",
  "maximizeAction",
  "maximizeCommand",
  "menuActionSection",
  "menuActionSectionVisible",
  "minimizeAction",
  "minimizeCommand",
  "minimizeMaximizeActionsSection",
  "moveCommand",
  "moreActionsSection",
  "newInstanceAction",
  "newInstanceActionState",
  "newInstanceCommand",
  "noBorderAction",
  "noBorderCommand",
  "resizeCommand",
  "shadeAction",
  "shadeCommand",
  "windowCapabilityActionState",
];

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuWindowActionLogic.mjs",
    import.meta.url,
  ),
  exportNames,
);
const facade = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.mjs", import.meta.url),
  exportNames,
);

const plain = (value) => JSON.parse(JSON.stringify(value));

function assertMatchesFacade(name, ...args) {
  assert.deepEqual(plain(logic[name](...args)), plain(facade[name](...args)));
}

for (const [name, args] of [
  ["newInstanceActionState", [{ canLaunchNewInstance: true, hasTask: true }]],
  ["newInstanceAction", [{ canLaunchNewInstance: true, hasTask: true }]],
  ["newInstanceCommand", []],
  ["moveCommand", []],
  ["resizeCommand", []],
  ["basicMoveAction", [{ capable: true, hasWindowTask: true, isWindow: true }]],
  [
    "basicResizeAction",
    [{ capable: false, hasWindowTask: true, isWindow: true }],
  ],
  [
    "basicActionsSection",
    [
      {
        canLaunchNewInstance: true,
        hasTask: true,
        hasWindowTask: true,
        isLauncher: false,
        isMovable: true,
        isResizable: false,
        isWindow: true,
        launcherActivitiesVisible: false,
      },
    ],
  ],
  ["minimizeCommand", []],
  ["maximizeCommand", []],
  [
    "minimizeAction",
    [{ capable: true, checked: true, hasWindowTask: true, isWindow: true }],
  ],
  [
    "maximizeAction",
    [{ capable: true, checked: false, hasWindowTask: true, isWindow: true }],
  ],
  [
    "minimizeMaximizeActionsSection",
    [
      {
        hasWindowTask: true,
        isMaximizable: true,
        isMaximized: false,
        isMinimizable: true,
        isMinimized: true,
        isWindow: true,
      },
    ],
  ],
  ["keepAboveCommand", []],
  ["keepBelowCommand", []],
  ["keepAboveAction", [{ checked: true, hasWindowTask: true, isWindow: true }]],
  [
    "keepBelowAction",
    [{ checked: false, hasWindowTask: false, isWindow: true }],
  ],
  [
    "keepAboveBelowActionsSection",
    [
      {
        hasWindowTask: true,
        isKeepAbove: true,
        isKeepBelow: false,
        isWindow: true,
      },
    ],
  ],
  ["fullscreenCommand", []],
  ["shadeCommand", []],
  ["noBorderCommand", []],
  [
    "fullscreenAction",
    [{ capable: true, checked: true, hasWindowTask: true, isWindow: true }],
  ],
  [
    "shadeAction",
    [{ capable: false, checked: true, hasWindowTask: true, isWindow: true }],
  ],
  [
    "noBorderAction",
    [{ capable: true, checked: false, hasWindowTask: true, isWindow: true }],
  ],
  [
    "fullscreenShadeBorderActionsSection",
    [
      {
        canSetNoBorder: true,
        fullScreenable: true,
        hasNoBorder: false,
        hasWindowTask: true,
        isFullScreen: true,
        isShadeable: false,
        isShaded: true,
        isWindow: true,
      },
    ],
  ],
  ["excludeFromCaptureCommand", []],
  [
    "excludeFromCaptureAction",
    [{ checked: true, hasWindowTask: true, isWindow: true }],
  ],
  [
    "captureActionsSection",
    [{ hasWindowTask: true, isExcludedFromCapture: true, isWindow: true }],
  ],
  ["closeCommand", []],
  ["closeActionState", [{ closable: true, hasTask: true, isWindow: true }]],
  ["closeAction", [{ closable: true, hasTask: true, isWindow: true }]],
  ["closeActionSection", [{ visible: true }]],
  ["closeActionsSection", [{ closable: true, hasTask: true, isWindow: true }]],
  [
    "windowCapabilityActionState",
    [{ capable: true, hasWindowTask: false, isWindow: true }],
  ],
  [
    "checkableWindowCapabilityActionState",
    [{ capable: true, checked: true, hasWindowTask: true, isWindow: true }],
  ],
  [
    "checkableWindowActionState",
    [{ checked: true, hasWindowTask: false, isWindow: true }],
  ],
  [
    "menuActionSectionVisible",
    [
      {
        hasWindowTask: false,
        launcherActivitiesVisible: false,
        newInstanceVisible: true,
      },
    ],
  ],
  [
    "menuActionSection",
    [
      {
        hasWindowTask: true,
        launcherActivitiesVisible: false,
        newInstanceVisible: false,
      },
    ],
  ],
  [
    "moreActionsSection",
    [
      {
        actions: [{ visible: false }, { visible: true }],
      },
    ],
  ],
]) {
  assertMatchesFacade(name, ...args);
}

assert.deepEqual(plain(logic.newInstanceCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestNewInstance",
});
assert.deepEqual(plain(logic.closeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestClose",
});
assert.deepEqual(
  plain(
    logic.windowCapabilityActionState({
      capable: false,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    visible: false,
  },
);

const newInstance = logic.newInstanceAction({
  canLaunchNewInstance: true,
  hasTask: true,
});
assert.equal(newInstance.icon, "window-new");
assert.equal(Object.keys(newInstance).includes("icon"), false);
assert.deepEqual(plain(newInstance), {
  command: {
    arguments: [],
    kind: "task-model-request",
    requestMethod: "requestNewInstance",
  },
  enabled: true,
  text: "New Instance",
  visible: true,
});

const moreActions = logic.moreActionsSection({
  actions: [{ visible: false }, { visible: true }],
}).moreActions;
assert.equal(moreActions.icon, "view-more-symbolic");
assert.equal(Object.keys(moreActions).includes("icon"), false);
assert.deepEqual(plain(moreActions), {
  enabled: true,
  text: "More",
  visible: true,
});
