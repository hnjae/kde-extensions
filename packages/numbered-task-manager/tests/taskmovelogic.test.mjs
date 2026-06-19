// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskMoveLogic.mjs", import.meta.url),
  ["dragMoveRejectionDiagnostic", "dragMoveRejectionResult"],
);
const taskActionUrl = new URL(
  "../package/contents/ui/TaskActionLogic.mjs",
  import.meta.url,
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(
  plain(logic.dragMoveRejectionResult({ canMove: true }, 1, 4)),
  {
    action: "dragMoveTask",
    code: "accepted",
    context: {
      reason: "unknown-rejection",
      sourceIndex: 1,
      targetIndex: 4,
    },
    diagnostic: false,
    ok: true,
  },
);
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
assert.equal(staleDragMove.diagnostic, true);
assert.equal(
  logic.dragMoveRejectionDiagnostic("pinned-launcher-denied"),
  false,
);
assert.equal(logic.dragMoveRejectionDiagnostic("missing-source"), true);

assert.equal(existsSync(taskActionUrl), false);
