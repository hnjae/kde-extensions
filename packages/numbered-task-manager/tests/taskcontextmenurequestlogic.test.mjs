// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuRequestLogic.mjs",
    import.meta.url,
  ),
  ["contextMenuCreationResult", "contextMenuRequestResult"],
);
const validModelIndex = { valid: true, row: 4 };

assert.equal(
  logic.contextMenuRequestResult({
    modelIndex: validModelIndex,
    task: { entryKey: "task-1", title: "Task" },
    taskRolePort: {},
    visualParent: { width: 320 },
  }).code,
  "ready",
);
assert.equal(
  logic.contextMenuRequestResult({
    modelIndex: validModelIndex,
    taskRolePort: {},
  }).code,
  "missing-visual-parent",
);
assert.equal(
  logic.contextMenuRequestResult({
    modelIndex: { valid: false, row: 4 },
    taskRolePort: {},
    visualParent: { width: 320 },
  }).code,
  "invalid-model-index",
);
assert.equal(logic.contextMenuCreationResult(null, {}).code, "create-failed");
assert.equal(
  logic.contextMenuCreationResult({ objectName: "menu" }, {}).ok,
  true,
);
