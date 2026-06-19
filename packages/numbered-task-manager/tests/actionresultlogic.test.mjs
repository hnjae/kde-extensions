// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/ActionResultLogic.mjs", import.meta.url),
  ["actionResult", "shouldLogActionResult"],
);
const taskActionSource = readFileSync(
  new URL("../package/contents/ui/TaskActionLogic.mjs", import.meta.url),
  "utf8",
);

assert.deepEqual(
  logic.actionResult("sampleAction", "sample-code", true, false, {
    key: "value",
  }),
  {
    action: "sampleAction",
    code: "sample-code",
    context: {
      key: "value",
    },
    diagnostic: false,
    ok: true,
  },
);

assert.equal(
  logic.shouldLogActionResult(
    logic.actionResult("sampleAction", "failed", false, true, {}),
  ),
  true,
);
assert.equal(
  logic.shouldLogActionResult(
    logic.actionResult("sampleAction", "quiet-failure", false, false, {}),
  ),
  false,
);
assert.equal(logic.shouldLogActionResult(null), false);

assert.match(
  taskActionSource,
  /import \{ actionResult \} from "\.\/ActionResultLogic\.mjs"/,
);
assert.doesNotMatch(
  taskActionSource,
  /export function actionResult\(action, code, ok, diagnostic, context\)/,
);
assert.doesNotMatch(taskActionSource, /export function shouldLogActionResult/);
