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
assert.match(
  mainQml,
  /\bRemoteAttentionSource\s*\{[\s\S]*?onActionResult:\s*result\s*=>\s*\{[\s\S]*?actionLogger\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.doesNotMatch(
  mainQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*attentionTasksModel[\s\S]*?publishRemoteAttention/,
);
assert.doesNotMatch(mainQml, /\bid:\s*attentionTasksModel\b/);
assert.doesNotMatch(mainQml, /taskModel:\s*attentionTasksModel/);
assert.match(
  sourceQml,
  /TaskManager\.TasksModel\s*\{[\s\S]*?id:\s*attentionTasksModel/,
);
assert.match(
  sourceQml,
  /readonly property var taskModel:\s*attentionTasksModel/,
);
assert.match(sourceQml, /function requestActivate\(modelIndex\)/);
assert.match(sourceQml, /attentionTasksModel\.requestActivate\(modelIndex\)/);
assert.match(
  sourceQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*root\.taskModel/,
);
assert.match(sourceQml, /signal attentionPublished\(/);
assert.match(sourceQml, /signal attentionRemoved\(/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /\bTaskEntryDiagnosticReporter\s*\{/);
assert.match(
  sourceQml,
  /roles:\s*\(\{[\s\S]*?activities:\s*model\.Activities[\s\S]*?demandingAttention:\s*model\.IsDemandingAttention[\s\S]*?index:[\s\S]*?isOnAllVirtualDesktops:\s*model\.IsOnAllVirtualDesktops[\s\S]*?isWindow:\s*model\.IsWindow[\s\S]*?modelIndex:\s*persistentModelIndex[\s\S]*?virtualDesktops:\s*model\.VirtualDesktops[\s\S]*?\}\)/,
);
assert.match(sourceQml, /taskEntryDiagnostics\.emitDiagnostics\(\)/);
assert.match(
  sourceQml,
  /property var attentionState:\s*RemoteAttentionLogic\.createRemoteAttentionState\(\)/,
);
assert.match(sourceQml, /readonly property int count:/);
assert.match(sourceQml, /readonly property var target:/);
assert.match(sourceQml, /readonly property var snapshot:/);
assert.match(sourceQml, /count:\s*root\.count/);
assert.match(sourceQml, /target:\s*root\.target/);
assert.match(
  mainQml,
  /VisibleTaskItemsLogic\.composeVisibleTaskItems\(normalTaskEntries,\s*remoteAttentionSource\.snapshot\)/,
);
assert.match(mainQml, /visibleTaskItems:\s*root\.visibleTaskItems/);
assert.match(
  mainQml,
  /onActivationRequested:\s*visibleItem\s*=>\s*\{[\s\S]*?taskActivation\.activateRemoteAttention\(visibleItem\);[\s\S]*?\}/,
);
assert.match(
  mainQml,
  /onContextMenuRequested:\s*request\s*=>\s*\{[\s\S]*?contextMenuAdapter\.openTaskContextMenu\(request\);[\s\S]*?\}/,
);
assert.doesNotMatch(mainQml, /count:\s*remoteAttentionSource\.count/);
assert.doesNotMatch(mainQml, /target:\s*remoteAttentionSource\.target/);
assert.doesNotMatch(
  mainQml,
  /readonly property var remoteAttentionVisibleItem:/,
);
assert.doesNotMatch(
  mainQml,
  /taskActivation\.activateRemoteAttention\(root\.remoteAttentionVisibleItem\)/,
);
assert.doesNotMatch(mainQml, /taskModel:\s*remoteAttentionSource\.taskModel/);
assert.match(
  sourceQml,
  /import "VisibleTaskItemsLogic\.js" as VisibleTaskItemsLogic/,
);
assert.match(sourceQml, /property var visibleTaskItems/);
assert.match(
  sourceQml,
  /readonly property var visibleItem:\s*VisibleTaskItemsLogic\.visibleRemoteAttentionItem\(root\.visibleTaskItems\)/,
);
assert.match(sourceQml, /readonly property bool itemVisible:/);
assert.match(sourceQml, /readonly property int itemCount:/);
assert.match(sourceQml, /readonly property var itemIconSource:/);
assert.match(sourceQml, /readonly property var itemModelIndex:/);
assert.match(sourceQml, /readonly property var itemTaskData:/);
assert.match(sourceQml, /readonly property string itemTitle:/);
assert.match(sourceQml, /signal activationRequested\(var visibleItem\)/);
assert.match(sourceQml, /signal contextMenuRequested\(var request\)/);
assert.match(sourceQml, /function requestVisibleActivation\(\)/);
assert.match(sourceQml, /root\.activationRequested\(root\.visibleItem\)/);
assert.match(sourceQml, /function requestVisibleContextMenu\(request\)/);
assert.match(
  sourceQml,
  /root\.contextMenuRequested\(Object\.assign\(\{\s*taskModel:\s*root\.taskModel\s*\},\s*request\)\)/,
);
assert.doesNotMatch(sourceQml, /property var publishAttention:/);
assert.doesNotMatch(sourceQml, /property var removeAttention:/);
assert.doesNotMatch(mainQml, /property var remoteAttentionState:/);
assert.doesNotMatch(mainQml, /function publishRemoteAttention\(/);
assert.doesNotMatch(mainQml, /function removeRemoteAttention\(/);
assert.doesNotMatch(mainQml, /publishAttention:/);
assert.doesNotMatch(mainQml, /removeAttention:/);
