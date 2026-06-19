// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuTaskCommandLogic.mjs",
    import.meta.url,
  ),
  [
    "contextMenuTaskExecutionResult",
    "contextMenuTaskRequest",
    "executeContextMenuTaskRequest",
  ],
);
const actionLogicSource = readFileSync(
  new URL("../package/contents/ui/TaskActionLogic.mjs", import.meta.url),
  "utf8",
);
const commandLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuCommandLogic.mjs",
    import.meta.url,
  ),
  ["contextMenuTaskCommand"],
);
const validModelIndex = { valid: true, row: 4 };

const readyRequest = logic.contextMenuTaskRequest(
  commandLogic.contextMenuTaskCommand("requestMove"),
  {
    requestMove() {},
  },
  validModelIndex,
  { entryKey: "task-1", title: "Task" },
);
assert.equal(readyRequest.code, "ready");
assert.equal(
  logic.contextMenuTaskExecutionResult(readyRequest).code,
  "executed",
);

assert.equal(
  logic.contextMenuTaskRequest(
    commandLogic.contextMenuTaskCommand("requestMove"),
    null,
    validModelIndex,
    {},
  ).code,
  "missing-task-model",
);
assert.equal(
  logic.contextMenuTaskRequest(
    commandLogic.contextMenuTaskCommand("requestUnknown"),
    {},
    validModelIndex,
    {},
  ).code,
  "unsupported-request-method",
);

assert.doesNotMatch(actionLogicSource, /function contextMenuTaskRequest/);
assert.doesNotMatch(
  actionLogicSource,
  /function executeContextMenuTaskRequest/,
);
assert.doesNotMatch(
  actionLogicSource,
  /function contextMenuTaskExecutionResult/,
);
