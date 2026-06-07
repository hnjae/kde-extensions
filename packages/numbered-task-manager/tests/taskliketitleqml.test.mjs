// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeTitle.qml",
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

assert.match(sourceQml, /QtQuick\.Text\s*\{/);
assert.match(sourceQml, /property bool strikeout:\s*false/);
assert.match(sourceQml, /property string title:\s*""/);
assert.match(sourceQml, /QtQuickLayouts\.Layout\.fillWidth:\s*root\.visible/);
assert.match(sourceQml, /color:\s*KirigamiPlatform\.Theme\.textColor/);
assert.match(sourceQml, /elide:\s*QtQuick\.Text\.ElideRight/);
assert.match(sourceQml, /font\.strikeout:\s*root\.strikeout/);
assert.match(sourceQml, /maximumLineCount:\s*1/);
assert.match(sourceQml, /text:\s*root\.title/);
assert.match(sourceQml, /verticalAlignment:\s*QtQuick\.Text\.AlignVCenter/);

assert.match(taskItemQml, /\bTaskLikeTitle\s*\{/);
assert.match(taskItemQml, /strikeout:\s*root\.minimized/);
assert.match(taskItemQml, /title:\s*root\.title/);
assert.match(taskItemQml, /visible:\s*root\.titleVisible/);
assert.doesNotMatch(taskItemQml, /text:\s*root\.title/);
assert.doesNotMatch(taskItemQml, /font\.strikeout:\s*root\.minimized/);
assert.doesNotMatch(taskItemQml, /elide:\s*QtQuick\.Text\.ElideRight/);

assert.match(attentionItemQml, /\bTaskLikeTitle\s*\{/);
assert.match(attentionItemQml, /title:\s*root\.title/);
assert.match(attentionItemQml, /visible:\s*root\.titleVisible/);
assert.doesNotMatch(attentionItemQml, /text:\s*root\.title/);
assert.doesNotMatch(attentionItemQml, /font\.strikeout/);
assert.doesNotMatch(attentionItemQml, /elide:\s*QtQuick\.Text\.ElideRight/);
