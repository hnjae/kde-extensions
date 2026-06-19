// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskActivationLogic.mjs", import.meta.url),
  [
    "activationExecutionResult",
    "shortcutActivationRequest",
    "taskActivationRequest",
  ],
);
const taskActionUrl = new URL(
  "../package/contents/ui/TaskActionLogic.mjs",
  import.meta.url,
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

assert.equal(
  logic.taskActivationRequest(
    "activateTask",
    { entryKey: "bad-task", modelIndex: invalidModelIndex, sourceIndex: 2 },
    {
      requireSourceIndex: true,
      sourceModel: "normal",
    },
  ).code,
  "invalid-model-index",
);

const readyRequest = logic.taskActivationRequest("activateTask", normalTask, {
  requireSourceIndex: true,
  sourceModel: "normal",
});
assert.equal(
  logic.activationExecutionResult(readyRequest, {
    requestActivate() {},
  }).code,
  "executed",
);
assert.equal(
  logic.activationExecutionResult(readyRequest, null).code,
  "missing-activation-target",
);

assert.equal(logic.shortcutActivationRequest([], 0).code, "no-target");

assert.equal(existsSync(taskActionUrl), false);
