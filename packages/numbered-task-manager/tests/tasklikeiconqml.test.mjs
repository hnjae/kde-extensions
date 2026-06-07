// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeIcon.qml",
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

assert.match(sourceQml, /KirigamiPrimitives\.Icon\s*\{/);
assert.match(sourceQml, /import "TaskVisualLogic\.js" as TaskVisualLogic/);
assert.match(sourceQml, /property bool activeTask:\s*false/);
assert.match(sourceQml, /property bool highlighted:\s*false/);
assert.match(sourceQml, /property var fallback/);
assert.match(sourceQml, /property var source/);
assert.match(
  sourceQml,
  /TaskVisualLogic\.iconActive\(\{\s*active:\s*root\.activeTask,\s*highlighted:\s*root\.highlighted\s*\}\)/,
);

assert.match(taskItemQml, /\bTaskLikeIcon\s*\{/);
assert.match(taskItemQml, /activeTask:\s*root\.active/);
assert.match(taskItemQml, /highlighted:\s*root\.visualHighlighted/);
assert.match(
  taskItemQml,
  /fallback:\s*TaskEntryLogic\.normalTaskIconFallback\(\)/,
);
assert.match(taskItemQml, /source:\s*root\.iconSource/);
assert.doesNotMatch(taskItemQml, /KirigamiPrimitives\.Icon\s*\{/);

assert.match(attentionItemQml, /\bTaskLikeIcon\s*\{/);
assert.match(attentionItemQml, /highlighted:\s*root\.visualHighlighted/);
assert.match(
  attentionItemQml,
  /fallback:\s*TaskEntryLogic\.remoteAttentionIconFallback\(\)/,
);
assert.match(attentionItemQml, /source:\s*root\.iconSource/);
assert.doesNotMatch(attentionItemQml, /KirigamiPrimitives\.Icon\s*\{/);
