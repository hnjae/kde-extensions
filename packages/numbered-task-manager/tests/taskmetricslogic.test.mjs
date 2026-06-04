// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskMetricsLogic.js", import.meta.url),
  ["adjustedFrameMargin", "iconExtentForTaskFrame"],
);

assert.equal(logic.adjustedFrameMargin(56, 8, 4, 16), 4);
assert.equal(logic.adjustedFrameMargin(18, 8, 4, 16), 2);
assert.equal(logic.adjustedFrameMargin(0, 8, 4, 16), 4);

assert.equal(logic.iconExtentForTaskFrame(56, 4, 4, 16), 48);
assert.equal(logic.iconExtentForTaskFrame(40, 4, 4, 16), 32);
assert.equal(logic.iconExtentForTaskFrame(18, 4, 4, 16), 14);
assert.equal(logic.iconExtentForTaskFrame(0, 4, 4, 16), 0);

const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);
assert.match(
  attentionItemQml,
  /import "TaskMetricsLogic\.js" as TaskMetricsLogic/,
);
assert.match(attentionItemQml, /iconExtentForTaskFrame\(/);

const presentationLogicJs = readFileSync(
  new URL(
    "../package/contents/ui/TaskItemPresentationLogic.js",
    import.meta.url,
  ),
  "utf8",
);
assert.match(presentationLogicJs, /Qt\.include\("TaskMetricsLogic\.js"\)/);
assert.match(presentationLogicJs, /iconExtentForTaskFrame\(/);
