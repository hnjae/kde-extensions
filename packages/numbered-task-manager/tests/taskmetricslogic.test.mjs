// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskMetricsLogic.js", import.meta.url),
  [
    "adjustedFrameMargin",
    "attentionNaturalWidthMinimum",
    "iconExtentForTaskFrame",
    "maximumSlotWidth",
    "minimumReadableSlotWidth",
    "normalNaturalWidthMinimum",
    "taskExtent",
    "taskImplicitWidth",
    "taskNaturalImplicitWidth",
    "taskTitleVisible",
    "taskSlotWidth",
    "titleVisibilityThreshold",
  ],
);

assert.equal(logic.taskExtent(), 40);
assert.equal(logic.titleVisibilityThreshold(), 96);
assert.equal(logic.maximumSlotWidth(), 220);
assert.equal(logic.normalNaturalWidthMinimum(true), 96);
assert.equal(logic.normalNaturalWidthMinimum(false), 0);
assert.equal(logic.attentionNaturalWidthMinimum(), 112);
assert.equal(logic.minimumReadableSlotWidth(40, 4), 48);

assert.equal(logic.adjustedFrameMargin(56, 8, 4, 16), 4);
assert.equal(logic.adjustedFrameMargin(18, 8, 4, 16), 2);
assert.equal(logic.adjustedFrameMargin(0, 8, 4, 16), 4);

assert.equal(logic.iconExtentForTaskFrame(56, 4, 4, 16), 48);
assert.equal(logic.iconExtentForTaskFrame(40, 4, 4, 16), 32);
assert.equal(logic.iconExtentForTaskFrame(18, 4, 4, 16), 14);
assert.equal(logic.iconExtentForTaskFrame(0, 4, 4, 16), 0);

assert.equal(logic.taskTitleVisible(true, 0, 96), true);
assert.equal(logic.taskTitleVisible(true, -1, 96), true);
assert.equal(logic.taskTitleVisible(true, 95, 96), false);
assert.equal(logic.taskTitleVisible(true, 96, 96), true);
assert.equal(logic.taskTitleVisible(false, 120, 96), false);

assert.equal(logic.taskImplicitWidth(140, 220), 140);
assert.equal(logic.taskImplicitWidth(0, 220), 220);
assert.equal(logic.taskImplicitWidth(-1, 220), 220);

assert.equal(logic.taskNaturalImplicitWidth(96, 220, 80, 20), 100);
assert.equal(logic.taskNaturalImplicitWidth(112, 220, 80, 20), 112);
assert.equal(logic.taskNaturalImplicitWidth(96, 220, 240, 20), 220);

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
assert.match(
  attentionItemQml,
  /property int titleVisibilityThreshold:\s*TaskMetricsLogic\.titleVisibilityThreshold\(\)/,
);
assert.match(
  attentionItemQml,
  /TaskMetricsLogic\.taskNaturalImplicitWidth\(TaskMetricsLogic\.attentionNaturalWidthMinimum\(\), TaskMetricsLogic\.maximumSlotWidth\(\), contentRow\.implicitWidth, contentRow\.horizontalPadding\)/,
);
assert.match(
  attentionItemQml,
  /implicitHeight:\s*TaskMetricsLogic\.taskExtent\(\)/,
);
assert.match(
  attentionItemQml,
  /implicitWidth:\s*TaskMetricsLogic\.taskImplicitWidth\(root\.slotWidth, naturalImplicitWidth\)/,
);
assert.match(
  attentionItemQml,
  /readonly property bool titleVisible:\s*TaskMetricsLogic\.taskTitleVisible\(root\.showTitle, root\.slotWidth, root\.titleVisibilityThreshold\)/,
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

const taskListRepresentationQml = readFileSync(
  new URL("../package/contents/ui/TaskListRepresentation.qml", import.meta.url),
  "utf8",
);
assert.match(
  taskListRepresentationQml,
  /import "TaskMetricsLogic\.js" as TaskMetricsLogic/,
);
assert.match(
  taskListRepresentationQml,
  /taskExtent:\s*TaskMetricsLogic\.taskExtent\(\)/,
);
assert.match(
  taskListRepresentationQml,
  /titleVisibilityThreshold:\s*TaskMetricsLogic\.titleVisibilityThreshold\(\)/,
);
assert.match(
  taskListRepresentationQml,
  /minimumReadableSlotWidth:\s*TaskMetricsLogic\.minimumReadableSlotWidth\(taskExtent, Kirigami\.Units\.smallSpacing\)/,
);
assert.match(
  taskListRepresentationQml,
  /TaskMetricsLogic\.maximumSlotWidth\(\)/,
);
assert.match(taskListRepresentationQml, /TaskMetricsLogic\.taskSlotWidth\(/);

const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
assert.match(taskItemQml, /import "TaskMetricsLogic\.js" as TaskMetricsLogic/);
assert.match(
  taskItemQml,
  /property int titleVisibilityThreshold:\s*TaskMetricsLogic\.titleVisibilityThreshold\(\)/,
);
assert.match(
  taskItemQml,
  /TaskMetricsLogic\.taskNaturalImplicitWidth\(TaskMetricsLogic\.normalNaturalWidthMinimum\(root\.showTitle\), TaskMetricsLogic\.maximumSlotWidth\(\), contentRow\.implicitWidth, contentRow\.horizontalPadding\)/,
);
assert.match(taskItemQml, /implicitHeight:\s*TaskMetricsLogic\.taskExtent\(\)/);
assert.match(
  taskItemQml,
  /implicitWidth:\s*TaskMetricsLogic\.taskImplicitWidth\(root\.slotWidth, naturalImplicitWidth\)/,
);
assert.match(
  taskItemQml,
  /readonly property bool titleVisible:\s*TaskMetricsLogic\.taskTitleVisible\(root\.showTitle, root\.slotWidth, root\.titleVisibilityThreshold\)/,
);
assert.doesNotMatch(
  taskItemQml,
  /implicitWidth:\s*root\.slotWidth > 0 \? root\.slotWidth : naturalImplicitWidth/,
);
assert.doesNotMatch(
  attentionItemQml,
  /implicitWidth:\s*root\.slotWidth > 0 \? root\.slotWidth : naturalImplicitWidth/,
);
assert.doesNotMatch(taskItemQml, /property int titleVisibilityThreshold:\s*96/);
assert.doesNotMatch(
  taskItemQml,
  /root\.showTitle && \(root\.slotWidth <= 0 \|\| root\.slotWidth >= root\.titleVisibilityThreshold\)/,
);
assert.doesNotMatch(taskItemQml, /root\.showTitle \? 96 : 0/);
assert.doesNotMatch(
  taskItemQml,
  /Math\.max\(TaskMetricsLogic\.normalNaturalWidthMinimum\(root\.showTitle\), Math\.min\(TaskMetricsLogic\.maximumSlotWidth\(\), contentRow\.implicitWidth \+ contentRow\.horizontalPadding\)\)/,
);
assert.doesNotMatch(
  attentionItemQml,
  /Math\.max\(TaskMetricsLogic\.attentionNaturalWidthMinimum\(\), Math\.min\(TaskMetricsLogic\.maximumSlotWidth\(\), contentRow\.implicitWidth \+ contentRow\.horizontalPadding\)\)/,
);
assert.doesNotMatch(
  attentionItemQml,
  /property int titleVisibilityThreshold:\s*96/,
);
assert.doesNotMatch(
  taskItemQml,
  /readonly property real contentHorizontalPadding/,
);
assert.doesNotMatch(
  attentionItemQml,
  /readonly property real contentHorizontalPadding/,
);
assert.doesNotMatch(
  attentionItemQml,
  /root\.showTitle && \(root\.slotWidth <= 0 \|\| root\.slotWidth >= root\.titleVisibilityThreshold\)/,
);
assert.doesNotMatch(
  taskListRepresentationQml,
  /readonly property int taskExtent:\s*40/,
);
assert.doesNotMatch(
  taskListRepresentationQml,
  /readonly property int titleVisibilityThreshold:\s*96/,
);
assert.doesNotMatch(
  taskListRepresentationQml,
  /TaskMetricsLogic\.taskSlotWidth\(width, visibleItemCount, minimumReadableSlotWidth, 220\)/,
);
