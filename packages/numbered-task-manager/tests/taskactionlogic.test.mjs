// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const actionLogic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskActionLogic.mjs", import.meta.url),
  [
    "activationExecutionResult",
    "contextMenuCreationResult",
    "contextMenuActionDispatchFailure",
    "contextMenuLauncherCommandDispatchResult",
    "contextMenuLauncherActivityResult",
    "contextMenuRequestResult",
    "executeContextMenuTaskRequest",
    "contextMenuTaskExecutionResult",
    "contextMenuTaskRequest",
    "dragMoveRejectionResult",
    "launcherMutationRequest",
    "launcherMutationResult",
    "launcherMutationPersistenceResult",
    "shortcutActivationRequest",
    "shouldLogActionResult",
    "taskActivationRequest",
    "taskEntryDiagnosticResult",
  ],
);
const commandLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuCommandLogic.mjs",
    import.meta.url,
  ),
  ["contextMenuLauncherCommand", "contextMenuTaskCommand"],
);
const logic = Object.assign({}, actionLogic, commandLogic);
const plain = (value) => JSON.parse(JSON.stringify(value));
const validModelIndex = { valid: true, row: 4 };
const invalidModelIndex = { valid: false, row: 4 };
const unknownShapeModelIndex = { row: 4 };
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

assert.deepEqual(
  plain(
    logic.taskActivationRequest(
      "activateTask",
      Object.assign({}, normalTask, {
        modelIndex: unknownShapeModelIndex,
      }),
      {
        requireSourceIndex: true,
        sourceModel: "normal",
      },
    ),
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
    modelIndex: unknownShapeModelIndex,
    ok: true,
    sourceModel: "normal",
  },
);

const readyNormalActivation = logic.taskActivationRequest(
  "activateTask",
  normalTask,
  {
    requireSourceIndex: true,
    sourceModel: "normal",
  },
);
assert.deepEqual(
  plain(
    logic.activationExecutionResult(readyNormalActivation, {
      requestActivate() {},
    }),
  ),
  {
    action: "activateTask",
    code: "executed",
    context: {
      entryKey: "normal-task",
      modelIndexValid: true,
      requireSourceIndex: true,
      sourceIndex: 1,
      sourceModel: "normal",
      title: "Normal Task",
    },
    diagnostic: false,
    ok: true,
  },
);

const missingActivationTarget = logic.activationExecutionResult(
  readyNormalActivation,
  null,
);
assert.equal(missingActivationTarget.ok, false);
assert.equal(missingActivationTarget.code, "missing-activation-target");
assert.equal(logic.shouldLogActionResult(missingActivationTarget), true);

const missingActivateMethod = logic.activationExecutionResult(
  readyNormalActivation,
  {},
);
assert.equal(missingActivateMethod.ok, false);
assert.equal(missingActivateMethod.code, "missing-request-activate");
assert.equal(logic.shouldLogActionResult(missingActivateMethod), true);

const thrownActivation = logic.activationExecutionResult(
  readyNormalActivation,
  {
    requestActivate() {},
  },
  new Error("activation failed"),
);
assert.equal(thrownActivation.ok, false);
assert.equal(thrownActivation.code, "request-threw");
assert.equal(thrownActivation.context.error, "activation failed");
assert.equal(thrownActivation.context.errorMessage, "activation failed");
assert.equal(thrownActivation.context.errorName, "Error");
assert.equal(logic.shouldLogActionResult(thrownActivation), true);

const projectionDiagnostic = logic.taskEntryDiagnosticResult({
  code: "unknown-model-index-shape",
  context: {
    publicationKey: "normal:1",
    sourceModel: "normal",
    sourceRow: 3,
  },
  field: "modelIndex",
});
assert.deepEqual(plain(projectionDiagnostic), {
  action: "projectTaskEntry",
  code: "unknown-model-index-shape",
  context: {
    field: "modelIndex",
    publicationKey: "normal:1",
    sourceModel: "normal",
    sourceRow: 3,
  },
  diagnostic: true,
  ok: false,
});
assert.equal(logic.shouldLogActionResult(projectionDiagnostic), true);

const visibleItems = [
  {
    entry: normalTask,
    isMeta0Target: false,
    kind: "normal",
    numbered: true,
    slotNumber: 1,
    sourceIndex: 0,
    sourceModel: "normal",
  },
  {
    entry: remoteTask,
    isMeta0Target: true,
    kind: "remoteAttention",
    numbered: false,
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

const mismatchedDescriptorActivation = logic.shortcutActivationRequest(
  [
    {
      entry: normalTask,
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 1,
      sourceIndex: 0,
      sourceModel: "remoteAttention",
    },
  ],
  0,
);
assert.equal(mismatchedDescriptorActivation.ok, false);
assert.equal(mismatchedDescriptorActivation.code, "invalid-visible-item");
assert.equal(
  mismatchedDescriptorActivation.context.validationCode,
  "source-model-mismatch",
);
assert.equal(
  mismatchedDescriptorActivation.context.sourceModel,
  "remoteAttention",
);
assert.equal(
  mismatchedDescriptorActivation.context.expectedSourceModel,
  "normal",
);
assert.equal(logic.shouldLogActionResult(mismatchedDescriptorActivation), true);

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

assert.deepEqual(
  plain(
    logic.contextMenuRequestResult({
      modelIndex: unknownShapeModelIndex,
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
    modelIndex: unknownShapeModelIndex,
    ok: true,
    task: normalTask,
    taskModel,
    visualParent,
    visualParentWidth: 128,
  },
);

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

const missingTaskDispatcher = logic.contextMenuActionDispatchFailure(
  {
    command: logic.contextMenuTaskCommand("requestMove"),
    kind: "task-model-request",
    update: null,
  },
  "missing-task-command-adapter",
);
assert.deepEqual(plain(missingTaskDispatcher), {
  action: "dispatchContextMenuAction",
  code: "missing-task-command-adapter",
  context: {
    requestMethod: "requestMove",
    routeKind: "task-model-request",
  },
  diagnostic: true,
  ok: false,
});
assert.equal(logic.shouldLogActionResult(missingTaskDispatcher), true);

assert.deepEqual(
  plain(
    logic.contextMenuActionDispatchFailure(
      {
        command: null,
        kind: "none",
        update: null,
      },
      "unknown-route",
    ),
  ),
  {
    action: "dispatchContextMenuAction",
    code: "unknown-route",
    context: {
      routeKind: "none",
    },
    diagnostic: true,
    ok: false,
  },
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
  requestActivities() {},
  requestClose() {},
  requestNewInstance() {},
  requestNewVirtualDesktop() {},
  requestMove() {},
  requestResize() {},
  requestToggleExcludeFromCapture() {},
  requestToggleFullScreen() {},
  requestToggleKeepAbove() {},
  requestToggleKeepBelow() {},
  requestToggleMaximized() {},
  requestToggleMinimized() {},
  requestToggleNoBorder() {},
  requestToggleShaded() {},
  requestVirtualDesktops() {},
};
for (const requestMethod of [
  "requestNewInstance",
  "requestMove",
  "requestResize",
  "requestToggleMinimized",
  "requestToggleMaximized",
  "requestToggleKeepAbove",
  "requestToggleKeepBelow",
  "requestToggleFullScreen",
  "requestToggleShaded",
  "requestToggleNoBorder",
  "requestToggleExcludeFromCapture",
  "requestClose",
  "requestActivities",
  "requestVirtualDesktops",
  "requestNewVirtualDesktop",
]) {
  assert.equal(
    logic.contextMenuTaskRequest(
      logic.contextMenuTaskCommand(requestMethod),
      taskRequestModel,
      validModelIndex,
      normalTask,
    ).ok,
    true,
    `${requestMethod} should be supported`,
  );
}
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
    errorMessage: "request failed",
    errorName: "Error",
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
  {
    requestMove() {},
  },
  validModelIndex,
  normalTask,
);
assert.equal(missingMethodRequest.ok, false);
assert.equal(missingMethodRequest.code, "missing-request-method");
assert.equal(logic.shouldLogActionResult(missingMethodRequest), true);

const unsupportedPortMethodRequest = logic.contextMenuTaskRequest(
  "requestResize",
  {
    requestResize() {},
    supportsContextMenuTaskRequest() {
      return false;
    },
  },
  validModelIndex,
  normalTask,
);
assert.equal(unsupportedPortMethodRequest.ok, false);
assert.equal(unsupportedPortMethodRequest.code, "missing-request-method");
assert.equal(logic.shouldLogActionResult(unsupportedPortMethodRequest), true);

const unsupportedTaskRequest = logic.contextMenuTaskRequest(
  "requestDangerousExistingMethod",
  {
    requestDangerousExistingMethod() {},
  },
  validModelIndex,
  normalTask,
);
assert.equal(unsupportedTaskRequest.ok, false);
assert.equal(unsupportedTaskRequest.code, "unsupported-request-method");
assert.equal(logic.shouldLogActionResult(unsupportedTaskRequest), true);

assert.equal(
  logic.contextMenuTaskRequest(
    logic.contextMenuTaskCommand("requestMove"),
    taskRequestModel,
    unknownShapeModelIndex,
    normalTask,
  ).ok,
  true,
);

const executedTaskRequests = [];
const executionTaskModel = {
  requestMove(modelIndex) {
    executedTaskRequests.push(["requestMove", modelIndex]);
  },
  requestVirtualDesktops(modelIndex, desktops) {
    executedTaskRequests.push(["requestVirtualDesktops", modelIndex, desktops]);
  },
};
assert.deepEqual(
  plain(
    logic.executeContextMenuTaskRequest(
      logic.contextMenuTaskRequest(
        logic.contextMenuTaskCommand("requestMove"),
        executionTaskModel,
        validModelIndex,
        normalTask,
      ),
      executionTaskModel,
    ),
  ),
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
assert.deepEqual(executedTaskRequests, [["requestMove", validModelIndex]]);

logic.executeContextMenuTaskRequest(
  logic.contextMenuTaskRequest(
    logic.contextMenuTaskCommand("requestVirtualDesktops", ["desktop-a"]),
    executionTaskModel,
    validModelIndex,
    normalTask,
  ),
  executionTaskModel,
);
assert.deepEqual(executedTaskRequests, [
  ["requestMove", validModelIndex],
  ["requestVirtualDesktops", validModelIndex, ["desktop-a"]],
]);

const thrownExecutionRequest = logic.executeContextMenuTaskRequest(
  logic.contextMenuTaskRequest(
    logic.contextMenuTaskCommand("requestMove"),
    {
      requestMove() {
        throw new Error("request failed");
      },
    },
    validModelIndex,
    normalTask,
  ),
  {
    requestMove() {
      throw new Error("request failed");
    },
  },
);
assert.equal(thrownExecutionRequest.ok, false);
assert.equal(thrownExecutionRequest.code, "request-threw");
assert.equal(logic.shouldLogActionResult(thrownExecutionRequest), true);

assert.deepEqual(
  plain(
    logic.contextMenuLauncherActivityResult(
      {
        changed: false,
        ok: false,
        reason: "invalid-position",
      },
      "invalid-launcher-activity-update",
      "app.desktop",
    ),
  ),
  {
    action: "updateLauncherActivities",
    code: "invalid-launcher-activity-update",
    context: {
      changed: false,
      launcherUrl: "app.desktop",
      reason: "invalid-position",
    },
    diagnostic: true,
    ok: false,
  },
);
assert.equal(
  logic.shouldLogActionResult(
    logic.contextMenuLauncherActivityResult(
      { ok: false, reason: "invalid-position" },
      "invalid-launcher-activity-update",
      "app.desktop",
    ),
  ),
  true,
);

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

const launcherPersistenceRequest = logic.launcherMutationRequest(
  "pinLauncher",
  "app.desktop",
);
assert.deepEqual(
  plain(
    logic.launcherMutationPersistenceResult(launcherPersistenceRequest, {
      code: "write-mismatch",
      configLaunchers: ["old.desktop"],
      failedTargets: ["config"],
      launchers: ["app.desktop"],
      modelLaunchers: ["app.desktop"],
      ok: false,
    }),
  ),
  {
    action: "pinLauncher",
    code: "write-mismatch",
    context: {
      configLaunchers: ["old.desktop"],
      failedTargets: ["config"],
      launchers: ["app.desktop"],
      launcherUrl: "app.desktop",
      modelLaunchers: ["app.desktop"],
      syncCode: "write-mismatch",
    },
    diagnostic: true,
    launcherUrl: "app.desktop",
    ok: false,
  },
);

const missingLauncherSync = logic.launcherMutationPersistenceResult(
  launcherPersistenceRequest,
  {
    code: "missing-launcher-sync",
    failedTargets: ["sync"],
    launchers: ["app.desktop"],
    ok: false,
  },
);
assert.equal(missingLauncherSync.ok, false);
assert.equal(missingLauncherSync.code, "missing-launcher-sync");
assert.equal(missingLauncherSync.context.launcherUrl, "app.desktop");
assert.deepEqual(missingLauncherSync.context.failedTargets, ["sync"]);

const thrownLauncherPersistence = logic.launcherMutationPersistenceResult(
  launcherPersistenceRequest,
  {
    code: "launcher-persistence-threw",
    error: Object.assign(new Error("persist failed"), {
      code: "E_PERSIST_FAILED",
    }),
    failedTargets: ["sync"],
    launchers: ["app.desktop"],
    ok: false,
  },
);
assert.equal(thrownLauncherPersistence.ok, false);
assert.equal(thrownLauncherPersistence.code, "launcher-persistence-threw");
assert.equal(thrownLauncherPersistence.context.error, "persist failed");
assert.equal(thrownLauncherPersistence.context.errorCode, "E_PERSIST_FAILED");
assert.equal(thrownLauncherPersistence.context.errorMessage, "persist failed");
assert.equal(thrownLauncherPersistence.context.errorName, "Error");
assert.equal(logic.shouldLogActionResult(thrownLauncherPersistence), true);

assert.deepEqual(
  plain(
    logic.launcherMutationPersistenceResult(launcherPersistenceRequest, {
      code: "converged",
      configLaunchers: ["app.desktop"],
      failedTargets: [],
      launchers: ["app.desktop"],
      ok: true,
    }),
  ),
  {
    action: "pinLauncher",
    code: "converged",
    context: {
      configLaunchers: ["app.desktop"],
      launchers: ["app.desktop"],
      launcherUrl: "app.desktop",
      syncCode: "converged",
    },
    diagnostic: false,
    launcherUrl: "app.desktop",
    ok: true,
  },
);

const rejectedLauncherMutation = logic.launcherMutationResult(
  logic.launcherMutationRequest("unpinLauncher", "app.desktop"),
  false,
);
assert.equal(rejectedLauncherMutation.ok, false);
assert.equal(rejectedLauncherMutation.code, "request-rejected");
assert.equal(rejectedLauncherMutation.context.launcherUrl, "app.desktop");
assert.equal(logic.shouldLogActionResult(rejectedLauncherMutation), true);

const thrownLauncherMutation = logic.launcherMutationResult(
  logic.launcherMutationRequest("pinLauncher", "app.desktop"),
  undefined,
  Object.assign(new Error("pin failed"), {
    code: "E_PIN_FAILED",
  }),
);
assert.equal(thrownLauncherMutation.ok, false);
assert.equal(thrownLauncherMutation.code, "request-threw");
assert.equal(thrownLauncherMutation.context.launcherUrl, "app.desktop");
assert.equal(thrownLauncherMutation.context.error, "pin failed");
assert.equal(thrownLauncherMutation.context.errorCode, "E_PIN_FAILED");
assert.equal(thrownLauncherMutation.context.errorMessage, "pin failed");
assert.equal(thrownLauncherMutation.context.errorName, "Error");
assert.equal(logic.shouldLogActionResult(thrownLauncherMutation), true);

assert.deepEqual(
  plain(
    logic.dragMoveRejectionResult(
      { canMove: false, reason: "boundary-crossing" },
      1,
      4,
    ),
  ),
  {
    action: "dragMoveTask",
    code: "boundary-crossing",
    context: {
      reason: "boundary-crossing",
      sourceIndex: 1,
      targetIndex: 4,
    },
    diagnostic: false,
    ok: false,
  },
);
const staleDragMove = logic.dragMoveRejectionResult(
  { canMove: false, reason: "missing-source" },
  12,
  2,
);
assert.equal(staleDragMove.ok, false);
assert.equal(staleDragMove.code, "missing-source");
assert.equal(staleDragMove.context.sourceIndex, 12);
assert.equal(staleDragMove.context.targetIndex, 2);
assert.equal(logic.shouldLogActionResult(staleDragMove), true);
assert.equal(
  logic.shouldLogActionResult(
    logic.dragMoveRejectionResult(
      { canMove: false, reason: "pinned-launcher-denied" },
      0,
      1,
    ),
  ),
  false,
);
