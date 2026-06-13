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
const plain = (value) => JSON.parse(JSON.stringify(value));

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
