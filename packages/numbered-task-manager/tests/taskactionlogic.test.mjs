// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskActionLogic.js", import.meta.url),
  [
    "contextMenuCreationResult",
    "contextMenuLauncherCommand",
    "contextMenuLauncherCommandDispatchResult",
    "contextMenuRequestResult",
    "contextMenuTaskCommand",
    "contextMenuTaskExecutionResult",
    "contextMenuTaskRequest",
    "launcherMutationRequest",
    "launcherMutationResult",
    "shortcutActivationRequest",
    "shouldLogActionResult",
    "taskActivationRequest",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const validModelIndex = { valid: true, row: 4 };
const invalidModelIndex = { valid: false, row: 4 };
const normalTask = {
  entryKey: "normal-task",
  modelIndex: validModelIndex,
  sourceIndex: 1,
  title: "Normal Task",
};
const remoteTask = {
  entryKey: "remote-task",
  modelIndex: validModelIndex,
  title: "Remote Task",
};

assert.deepEqual(
  plain(
    logic.taskActivationRequest("activateTask", normalTask, {
      requireSourceIndex: true,
      sourceModel: "normal",
    }),
  ),
  {
    action: "activateTask",
    code: "ready",
    context: {
      entryKey: "normal-task",
      requireSourceIndex: true,
      sourceIndex: 1,
      sourceModel: "normal",
      title: "Normal Task",
    },
    diagnostic: false,
    modelIndex: validModelIndex,
    ok: true,
    sourceModel: "normal",
  },
);

const invalidNormalActivation = logic.taskActivationRequest(
  "activateTask",
  { entryKey: "bad-task", modelIndex: invalidModelIndex, sourceIndex: 2 },
  {
    requireSourceIndex: true,
    sourceModel: "normal",
  },
);
assert.equal(invalidNormalActivation.ok, false);
assert.equal(invalidNormalActivation.code, "invalid-model-index");
assert.equal(logic.shouldLogActionResult(invalidNormalActivation), true);

const missingSourceActivation = logic.taskActivationRequest(
  "activateTask",
  remoteTask,
  {
    requireSourceIndex: true,
    sourceModel: "normal",
  },
);
assert.equal(missingSourceActivation.ok, false);
assert.equal(missingSourceActivation.code, "invalid-source-index");
assert.equal(logic.shouldLogActionResult(missingSourceActivation), true);

assert.equal(
  logic.taskActivationRequest("activateRemoteAttention", remoteTask, {
    requireSourceIndex: false,
    sourceModel: "remoteAttention",
  }).ok,
  true,
);

const visibleItems = [
  {
    entry: normalTask,
    isMeta0Target: false,
    kind: "normal",
    slotNumber: 1,
    sourceIndex: 0,
    sourceModel: "normal",
  },
  {
    entry: remoteTask,
    isMeta0Target: true,
    kind: "remoteAttention",
    slotNumber: 0,
    sourceIndex: -1,
    sourceModel: "remoteAttention",
  },
];

assert.equal(
  logic.shortcutActivationRequest(visibleItems, 0).modelIndex,
  validModelIndex,
);
assert.equal(
  logic.shortcutActivationRequest(visibleItems, 9).sourceModel,
  "remoteAttention",
);

const emptyShortcutResult = logic.shortcutActivationRequest([], 0);
assert.equal(emptyShortcutResult.ok, false);
assert.equal(emptyShortcutResult.code, "no-target");
assert.equal(logic.shouldLogActionResult(emptyShortcutResult), false);

const visualParent = { width: 128 };
const taskModel = { objectName: "tasksModel" };
assert.deepEqual(
  plain(
    logic.contextMenuRequestResult({
      modelIndex: validModelIndex,
      task: normalTask,
      taskModel,
      visualParent,
    }),
  ),
  {
    action: "openContextMenu",
    code: "ready",
    context: {
      entryKey: "normal-task",
      modelIndexValid: true,
      title: "Normal Task",
      visualParentWidth: 128,
    },
    diagnostic: false,
    modelIndex: validModelIndex,
    ok: true,
    task: normalTask,
    taskModel,
    visualParent,
    visualParentWidth: 128,
  },
);

const invalidMenuRequest = logic.contextMenuRequestResult({
  modelIndex: invalidModelIndex,
  task: normalTask,
  taskModel,
  visualParent,
});
assert.equal(invalidMenuRequest.ok, false);
assert.equal(invalidMenuRequest.code, "invalid-model-index");
assert.equal(logic.shouldLogActionResult(invalidMenuRequest), true);

const creationFailure = logic.contextMenuCreationResult(null, {
  context: { entryKey: "normal-task" },
});
assert.deepEqual(plain(creationFailure), {
  action: "openContextMenu",
  code: "create-failed",
  context: {
    entryKey: "normal-task",
  },
  diagnostic: true,
  ok: false,
});
assert.equal(logic.shouldLogActionResult(creationFailure), true);

assert.equal(
  logic.contextMenuCreationResult({ objectName: "menu" }, {}).ok,
  true,
);

assert.deepEqual(
  plain(logic.contextMenuLauncherCommand("pinLauncher", "app.desktop")),
  {
    action: "pinLauncher",
    kind: "launcher-command",
    launcherUrl: "app.desktop",
    launchers: [],
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuLauncherCommand("replaceLauncherList", [
      "",
      "app.desktop",
    ]),
  ),
  {
    action: "replaceLauncherList",
    kind: "launcher-command",
    launcherUrl: "",
    launchers: ["app.desktop"],
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuLauncherCommandDispatchResult(
      logic.contextMenuLauncherCommand("pinLauncher", "app.desktop"),
    ),
  ),
  {
    action: "pinLauncher",
    code: "ready",
    context: {
      launcherUrl: "app.desktop",
    },
    diagnostic: false,
    kind: "launcher-command",
    launcherUrl: "app.desktop",
    launchers: [],
    ok: true,
  },
);
const unknownLauncherCommand = logic.contextMenuLauncherCommandDispatchResult({
  action: "openPortal",
  kind: "launcher-command",
});
assert.deepEqual(plain(unknownLauncherCommand), {
  action: "openPortal",
  code: "unknown-launcher-command",
  context: {
    commandKind: "launcher-command",
  },
  diagnostic: true,
  kind: "launcher-command",
  launcherUrl: "",
  launchers: [],
  ok: false,
});
assert.equal(logic.shouldLogActionResult(unknownLauncherCommand), true);

const taskRequestModel = {
  requestMove() {},
  requestVirtualDesktops() {},
};
assert.deepEqual(plain(logic.contextMenuTaskCommand("requestMove")), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestMove",
});
assert.deepEqual(
  plain(logic.contextMenuTaskCommand("requestVirtualDesktops", ["desktop-a"])),
  {
    arguments: [["desktop-a"]],
    kind: "task-model-request",
    requestMethod: "requestVirtualDesktops",
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuTaskRequest(
      logic.contextMenuTaskCommand("requestMove"),
      taskRequestModel,
      validModelIndex,
      normalTask,
    ),
  ),
  {
    action: "requestMove",
    code: "ready",
    context: {
      entryKey: "normal-task",
      modelIndexValid: true,
      title: "Normal Task",
    },
    diagnostic: false,
    modelIndex: validModelIndex,
    ok: true,
    requestArguments: [],
    requestMethod: "requestMove",
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuTaskRequest(
      logic.contextMenuTaskCommand("requestVirtualDesktops", ["desktop-a"]),
      taskRequestModel,
      validModelIndex,
      normalTask,
    ),
  ),
  {
    action: "requestVirtualDesktops",
    code: "ready",
    context: {
      entryKey: "normal-task",
      modelIndexValid: true,
      title: "Normal Task",
    },
    diagnostic: false,
    modelIndex: validModelIndex,
    ok: true,
    requestArguments: [["desktop-a"]],
    requestMethod: "requestVirtualDesktops",
  },
);
const readyMoveRequest = logic.contextMenuTaskRequest(
  logic.contextMenuTaskCommand("requestMove"),
  taskRequestModel,
  validModelIndex,
  normalTask,
);
assert.deepEqual(
  plain(logic.contextMenuTaskExecutionResult(readyMoveRequest)),
  {
    action: "requestMove",
    code: "executed",
    context: {
      entryKey: "normal-task",
      modelIndexValid: true,
      title: "Normal Task",
    },
    diagnostic: false,
    ok: true,
    requestMethod: "requestMove",
  },
);
const thrownMoveRequest = logic.contextMenuTaskExecutionResult(
  readyMoveRequest,
  new Error("request failed"),
);
assert.deepEqual(plain(thrownMoveRequest), {
  action: "requestMove",
  code: "request-threw",
  context: {
    entryKey: "normal-task",
    error: "request failed",
    modelIndexValid: true,
    requestMethod: "requestMove",
    title: "Normal Task",
  },
  diagnostic: true,
  ok: false,
  requestMethod: "requestMove",
});
assert.equal(logic.shouldLogActionResult(thrownMoveRequest), true);

const missingTaskModelRequest = logic.contextMenuTaskRequest(
  "requestMove",
  null,
  validModelIndex,
  normalTask,
);
assert.equal(missingTaskModelRequest.ok, false);
assert.equal(missingTaskModelRequest.code, "missing-task-model");
assert.equal(logic.shouldLogActionResult(missingTaskModelRequest), true);

const invalidTaskRequest = logic.contextMenuTaskRequest(
  "requestMove",
  taskRequestModel,
  invalidModelIndex,
  normalTask,
);
assert.equal(invalidTaskRequest.ok, false);
assert.equal(invalidTaskRequest.code, "invalid-model-index");
assert.equal(logic.shouldLogActionResult(invalidTaskRequest), true);

const missingMethodRequest = logic.contextMenuTaskRequest(
  "requestResize",
  taskRequestModel,
  validModelIndex,
  normalTask,
);
assert.equal(missingMethodRequest.ok, false);
assert.equal(missingMethodRequest.code, "missing-request-method");
assert.equal(logic.shouldLogActionResult(missingMethodRequest), true);

assert.deepEqual(
  plain(logic.launcherMutationRequest("pinLauncher", "app.desktop")),
  {
    action: "pinLauncher",
    code: "ready",
    context: {
      launcherUrl: "app.desktop",
    },
    diagnostic: false,
    launcherUrl: "app.desktop",
    ok: true,
  },
);

const missingLauncherRequest = logic.launcherMutationRequest("pinLauncher", "");
assert.equal(missingLauncherRequest.ok, false);
assert.equal(missingLauncherRequest.code, "missing-launcher-url");
assert.equal(logic.shouldLogActionResult(missingLauncherRequest), false);

const acceptedLauncherMutation = logic.launcherMutationResult(
  logic.launcherMutationRequest("unpinLauncher", "app.desktop"),
  true,
);
assert.deepEqual(plain(acceptedLauncherMutation), {
  action: "unpinLauncher",
  code: "accepted",
  context: {
    launcherUrl: "app.desktop",
  },
  diagnostic: false,
  launcherUrl: "app.desktop",
  ok: true,
});

const rejectedLauncherMutation = logic.launcherMutationResult(
  logic.launcherMutationRequest("unpinLauncher", "app.desktop"),
  false,
);
assert.equal(rejectedLauncherMutation.ok, false);
assert.equal(rejectedLauncherMutation.code, "request-rejected");
assert.equal(rejectedLauncherMutation.context.launcherUrl, "app.desktop");
assert.equal(logic.shouldLogActionResult(rejectedLauncherMutation), true);
