// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskMetricsLogic.js", import.meta.url),
  ["adjustedFrameMargin", "iconExtentForTaskFrame", "taskSlotWidth"],
);

assert.equal(logic.adjustedFrameMargin(56, 8, 4, 16), 4);
assert.equal(logic.adjustedFrameMargin(18, 8, 4, 16), 2);
assert.equal(logic.adjustedFrameMargin(0, 8, 4, 16), 4);

assert.equal(logic.iconExtentForTaskFrame(56, 4, 4, 16), 48);
assert.equal(logic.iconExtentForTaskFrame(40, 4, 4, 16), 32);
assert.equal(logic.iconExtentForTaskFrame(18, 4, 4, 16), 14);
assert.equal(logic.iconExtentForTaskFrame(0, 4, 4, 16), 0);

assert.equal(logic.taskSlotWidth(1200, 3, 48, 220), 220);
assert.equal(logic.taskSlotWidth(600, 4, 48, 220), 150);
assert.equal(logic.taskSlotWidth(250, 4, 80, 220), 80);
assert.equal(logic.taskSlotWidth(600, 0, 80, 220), 0);
assert.equal(logic.taskSlotWidth(0, 3, 80, 220), 80);
assert.equal(logic.taskSlotWidth("wide", 3, 80, 220), 80);

const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);
assert.match(
  attentionItemQml,
  /import "TaskMetricsLogic\.js" as TaskMetricsLogic/,
);
assert.match(attentionItemQml, /iconExtentForTaskFrame\(/);
assert.match(attentionItemQml, /property real slotWidth:\s*0/);
assert.match(attentionItemQml, /property bool showTitle:\s*true/);
assert.match(attentionItemQml, /property int titleVisibilityThreshold:\s*96/);
assert.match(
  attentionItemQml,
  /root\.showTitle && \(root\.slotWidth <= 0 \|\| root\.slotWidth >= root\.titleVisibilityThreshold\)/,
);

const presentationLogicJs = readFileSync(
  new URL(
    "../package/contents/ui/TaskItemPresentationLogic.js",
    import.meta.url,
  ),
  "utf8",
);
assert.match(presentationLogicJs, /Qt\.include\("TaskMetricsLogic\.js"\)/);
assert.match(presentationLogicJs, /iconExtentForTaskFrame\(/);

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
assert.match(mainQml, /import "TaskMetricsLogic\.js" as TaskMetricsLogic/);
assert.match(
  mainQml,
  /minimumReadableSlotWidth:\s*taskExtent \+ 2 \* Kirigami\.Units\.smallSpacing/,
);
assert.match(mainQml, /TaskMetricsLogic\.taskSlotWidth\(/);
