// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskItem.qml",
  import.meta.url,
);
const normalTaskItemUrl = new URL(
  "../package/contents/ui/NormalTaskItem.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);
assert.equal(existsSync(normalTaskItemUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");
const normalTaskItemQml = readFileSync(normalTaskItemUrl, "utf8");

assert.match(sourceQml, /property bool vertical:\s*false/);
assert.doesNotMatch(normalTaskItemQml, /property bool vertical:\s*false/);

assert.match(sourceQml, /\bQtQuick\.Item\s*\{\s*id:\s*dragSurface\b/);
assert.match(
  sourceQml,
  /\bQtQuick\.Item\s*\{\s*id:\s*dragSurface[\s\S]*?width:\s*parent\.width[\s\S]*?height:\s*parent\.height/,
);
assert.match(
  sourceQml,
  /\bQtQuick\.Item\s*\{\s*id:\s*dragSurface[\s\S]*?TaskLikeItemShell\s*\{/,
);
assert.match(
  sourceQml,
  /\bQtQuick\.DropArea\s*\{[\s\S]*?anchors\.fill:\s*parent/,
);
assert.match(
  sourceQml,
  /\bQtQuick\.DropArea\s*\{[\s\S]*?onDropped:\s*drop\s*=>\s*\{[\s\S]*?root\.taskDropped\(sourceIndex,\s*root\.taskIndex,\s*drop\);[\s\S]*?\}/,
);
assert.match(
  normalTaskItemQml,
  /onTaskDropped:\s*\(sourceIndex,\s*targetIndex,\s*drop\)\s*=>\s*\{[\s\S]*?root\.moveAdapter\.moveTask\(sourceIndex,\s*targetIndex\)[\s\S]*?drop\.acceptProposedAction\(\);[\s\S]*?\}/,
);
assert.match(sourceQml, /target:\s*dragSurface/);
assert.match(sourceQml, /acceptedButtons:\s*QtQuick\.Qt\.LeftButton/);
assert.match(
  sourceQml,
  /xAxis\.enabled:\s*!root\.vertical[\s\S]*?yAxis\.enabled:\s*root\.vertical/,
);
assert.match(sourceQml, /QtQuick\.Drag\.active:\s*dragHandler\.active/);
assert.match(
  sourceQml,
  /QtQuick\.Drag\.mimeData:\s*TaskInteractionLogic\.taskDragMimeData\(root\.dragMimeType,\s*root\.taskIndex\)/,
);
assert.match(
  sourceQml,
  /QtQuick\.Drag\.supportedActions:\s*QtQuick\.Qt\.MoveAction/,
);
assert.match(sourceQml, /dragSurface\.Drag\.drop\(\)/);
assert.match(sourceQml, /dragSurface\.x\s*=\s*0;/);
assert.match(sourceQml, /dragSurface\.y\s*=\s*0;/);
assert.match(sourceQml, /dragSurface\.z\s*=\s*0;/);
assert.match(sourceQml, /root\.dropHover\s*=\s*false;/);
