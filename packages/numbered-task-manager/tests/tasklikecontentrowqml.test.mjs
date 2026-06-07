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

assert.match(taskItemQml, /\bTaskLikeContentRow\s*\{/);
assert.match(taskItemQml, /id:\s*contentRow/);
assert.match(taskItemQml, /frame:\s*taskFrame/);
assert.match(
  taskItemQml,
  /contentOpacity:\s*TaskVisualLogic\.contentOpacity\(\{/,
);
assert.doesNotMatch(taskItemQml, /QtQuickLayouts\.RowLayout\s*\{/);
assert.doesNotMatch(
  taskItemQml,
  /anchors\.bottomMargin:\s*taskFrame\.contentBottomMargin/,
);
assert.doesNotMatch(taskItemQml, /spacing:\s*Kirigami\.Units\.smallSpacing/);

assert.match(attentionItemQml, /\bTaskLikeContentRow\s*\{/);
assert.match(attentionItemQml, /id:\s*contentRow/);
assert.match(attentionItemQml, /frame:\s*taskFrame/);
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
