// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeContentRow.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");
const shellQml = readFileSync(
  new URL("../package/contents/ui/TaskLikeItemShell.qml", import.meta.url),
  "utf8",
);
const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);

assert.match(sourceQml, /QtQuickLayouts\.RowLayout\s*\{/);
assert.match(sourceQml, /property real contentOpacity:\s*1/);
assert.match(sourceQml, /property var frame/);
assert.match(
  sourceQml,
  /readonly property real frameBottomMargin:\s*frame \? frame\.contentBottomMargin : 0/,
);
assert.match(
  sourceQml,
  /readonly property real frameLeftMargin:\s*frame \? frame\.contentLeftMargin : 0/,
);
assert.match(
  sourceQml,
  /readonly property real frameRightMargin:\s*frame \? frame\.contentRightMargin : 0/,
);
assert.match(
  sourceQml,
  /readonly property real frameTopMargin:\s*frame \? frame\.contentTopMargin : 0/,
);
assert.match(
  sourceQml,
  /readonly property real horizontalPadding:\s*root\.frameLeftMargin \+ root\.frameRightMargin \+ Kirigami\.Units\.smallSpacing \* 2/,
);
assert.match(sourceQml, /anchors\.fill:\s*parent/);
assert.match(sourceQml, /anchors\.bottomMargin:\s*root\.frameBottomMargin/);
assert.match(
  sourceQml,
  /anchors\.leftMargin:\s*root\.frameLeftMargin \+ Kirigami\.Units\.smallSpacing/,
);
assert.match(
  sourceQml,
  /anchors\.rightMargin:\s*root\.frameRightMargin \+ Kirigami\.Units\.smallSpacing/,
);
assert.match(sourceQml, /anchors\.topMargin:\s*root\.frameTopMargin/);
assert.match(sourceQml, /opacity:\s*root\.contentOpacity/);
assert.match(sourceQml, /spacing:\s*Kirigami\.Units\.smallSpacing/);

assert.match(shellQml, /\bTaskLikeContentRow\s*\{/);
assert.match(shellQml, /id:\s*contentRow/);
assert.match(shellQml, /frame:\s*taskFrame/);
assert.match(
  shellQml,
  /TaskMetricsLogic\.taskNaturalImplicitWidth\(root\.naturalWidthMinimum, TaskMetricsLogic\.maximumSlotWidth\(\), contentRow\.implicitWidth, contentRow\.horizontalPadding\)/,
);
assert.match(taskItemQml, /\bTaskLikeItemShell\s*\{/);
assert.match(
  taskItemQml,
  /naturalWidthMinimum:\s*TaskMetricsLogic\.normalNaturalWidthMinimum\(root\.showTitle\)/,
);
assert.match(
  taskItemQml,
  /contentOpacity:\s*TaskVisualLogic\.contentOpacity\(\{/,
);
assert.doesNotMatch(taskItemQml, /\bTaskLikeContentRow\s*\{/);
assert.doesNotMatch(
  taskItemQml,
  /readonly property real contentHorizontalPadding/,
);
assert.doesNotMatch(
  taskItemQml,
  /taskFrame\.contentLeftMargin \+ taskFrame\.contentRightMargin \+ Kirigami\.Units\.smallSpacing \* 2/,
);
assert.doesNotMatch(taskItemQml, /QtQuickLayouts\.RowLayout\s*\{/);
assert.doesNotMatch(
  taskItemQml,
  /anchors\.bottomMargin:\s*taskFrame\.contentBottomMargin/,
);
assert.doesNotMatch(taskItemQml, /spacing:\s*Kirigami\.Units\.smallSpacing/);

assert.match(attentionItemQml, /\bTaskLikeItemShell\s*\{/);
assert.match(
  attentionItemQml,
  /naturalWidthMinimum:\s*TaskMetricsLogic\.attentionNaturalWidthMinimum\(\)/,
);
assert.doesNotMatch(attentionItemQml, /\bTaskLikeContentRow\s*\{/);
assert.doesNotMatch(
  attentionItemQml,
  /readonly property real contentHorizontalPadding/,
);
assert.doesNotMatch(
  attentionItemQml,
  /taskFrame\.contentLeftMargin \+ taskFrame\.contentRightMargin \+ Kirigami\.Units\.smallSpacing \* 2/,
);
assert.doesNotMatch(
  attentionItemQml,
  /contentOpacity:\s*TaskVisualLogic\.contentOpacity/,
);
assert.doesNotMatch(attentionItemQml, /QtQuickLayouts\.RowLayout\s*\{/);
assert.doesNotMatch(
  attentionItemQml,
  /anchors\.bottomMargin:\s*taskFrame\.contentBottomMargin/,
);
assert.doesNotMatch(
  attentionItemQml,
  /spacing:\s*Kirigami\.Units\.smallSpacing/,
);
