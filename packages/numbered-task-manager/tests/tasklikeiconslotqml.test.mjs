// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeIconSlot.qml",
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

assert.match(sourceQml, /^QtQuick\.Item\s*\{/m);
assert.match(sourceQml, /import QtQuick\.Layouts as QtQuickLayouts/);
assert.match(sourceQml, /property bool activeTask:\s*false/);
assert.match(sourceQml, /property bool highlighted:\s*false/);
assert.match(sourceQml, /property int iconExtent:\s*0/);
assert.match(sourceQml, /property var fallback/);
assert.match(sourceQml, /property var source/);
assert.match(
  sourceQml,
  /default property alias badgeContent:\s*badgeLayer\.data/,
);
assert.match(
  sourceQml,
  /QtQuickLayouts\.Layout\.alignment:\s*QtQuick\.Qt\.AlignVCenter/,
);
assert.match(
  sourceQml,
  /QtQuickLayouts\.Layout\.preferredHeight:\s*root\.iconExtent/,
);
assert.match(
  sourceQml,
  /QtQuickLayouts\.Layout\.preferredWidth:\s*root\.iconExtent/,
);
assert.match(sourceQml, /\bTaskLikeIcon\s*\{/);
assert.match(sourceQml, /anchors\.fill:\s*parent/);
assert.match(sourceQml, /activeTask:\s*root\.activeTask/);
assert.match(sourceQml, /fallback:\s*root\.fallback/);
assert.match(sourceQml, /highlighted:\s*root\.highlighted/);
assert.match(sourceQml, /source:\s*root\.source/);
assert.match(sourceQml, /id:\s*badgeLayer/);
assert.match(sourceQml, /anchors\.fill:\s*parent/);

assert.match(taskItemQml, /\bTaskLikeIconSlot\s*\{/);
assert.match(taskItemQml, /activeTask:\s*root\.active/);
assert.match(
  taskItemQml,
  /fallback:\s*TaskEntryLogic\.normalTaskIconFallback\(\)/,
);
assert.match(taskItemQml, /highlighted:\s*root\.visualHighlighted/);
assert.match(taskItemQml, /iconExtent:\s*root\.iconExtent/);
assert.match(taskItemQml, /source:\s*root\.iconSource/);
assert.match(taskItemQml, /anchors\.left:\s*parent\.left/);
assert.match(taskItemQml, /anchors\.bottom:\s*parent\.bottom/);
assert.match(taskItemQml, /scale:\s*0\.85/);

assert.match(attentionItemQml, /\bTaskLikeIconSlot\s*\{/);
assert.match(
  attentionItemQml,
  /fallback:\s*TaskEntryLogic\.remoteAttentionIconFallback\(\)/,
);
assert.match(attentionItemQml, /highlighted:\s*root\.visualHighlighted/);
assert.match(attentionItemQml, /iconExtent:\s*root\.iconExtent/);
assert.match(attentionItemQml, /source:\s*root\.iconSource/);
assert.match(attentionItemQml, /anchors\.right:\s*parent\.right/);
assert.match(attentionItemQml, /anchors\.top:\s*parent\.top/);
assert.match(attentionItemQml, /scale:\s*0\.78/);
