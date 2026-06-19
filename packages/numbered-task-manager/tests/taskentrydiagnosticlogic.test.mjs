// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskEntryDiagnosticLogic.mjs",
    import.meta.url,
  ),
  ["taskEntryDiagnosticResult"],
);
const taskActionSource = readFileSync(
  new URL("../package/contents/ui/TaskActionLogic.mjs", import.meta.url),
  "utf8",
);
const plain = (value) => JSON.parse(JSON.stringify(value));

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

assert.deepEqual(plain(logic.taskEntryDiagnosticResult()), {
  action: "projectTaskEntry",
  code: "invalid-task-entry",
  context: {
    field: "",
  },
  diagnostic: true,
  ok: false,
});

assert.doesNotMatch(taskActionSource, /function taskEntryDiagnosticResult/);
