// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/RemoteAttentionSource.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bRemoteAttentionSource\s*\{/);
assert.doesNotMatch(
  mainQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*attentionTasksModel[\s\S]*?publishRemoteAttention/,
);
assert.match(
  sourceQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*root\.taskModel/,
);
assert.match(sourceQml, /signal attentionPublished\(/);
assert.match(sourceQml, /signal attentionRemoved\(/);
assert.match(
  sourceQml,
  /property var attentionState:\s*RemoteAttentionLogic\.createRemoteAttentionState\(\)/,
);
assert.match(sourceQml, /readonly property int count:/);
assert.match(sourceQml, /readonly property var target:/);
assert.doesNotMatch(sourceQml, /property var publishAttention:/);
assert.doesNotMatch(sourceQml, /property var removeAttention:/);
assert.doesNotMatch(mainQml, /property var remoteAttentionState:/);
assert.doesNotMatch(mainQml, /function publishRemoteAttention\(/);
assert.doesNotMatch(mainQml, /function removeRemoteAttention\(/);
assert.doesNotMatch(mainQml, /publishAttention:/);
assert.doesNotMatch(mainQml, /removeAttention:/);
