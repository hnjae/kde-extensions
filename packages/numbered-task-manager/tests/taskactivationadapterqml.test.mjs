// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const normalTaskItemQml = readFileSync(
  new URL("../package/contents/ui/NormalTaskItem.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskActivationAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskActivationAdapter\s*\{/);
assert.match(mainQml, /id:\s*taskActivation/);
assert.match(mainQml, /\bTaskActivationPort\s*\{/);
assert.match(mainQml, /id:\s*taskActivationPort/);
assert.match(mainQml, /taskActivationPort:\s*taskActivationPort/);
assert.match(mainQml, /remoteAttentionSource:\s*remoteAttentionSource/);
assert.match(mainQml, /visibleTaskItems:\s*root\.visibleTaskItems/);
assert.match(
  mainQml,
  /onActionResult:\s*result\s*=>\s*\{[\s\S]*?actionLogger\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.match(mainQml, /taskActivation\.activateTaskAtIndex\(/);
assert.doesNotMatch(mainQml, /taskActivation\.activateTaskEntry\(entry\)/);
assert.match(
  normalTaskItemQml,
  /root\.activationAdapter\.activateTaskEntry\(root\.entry\)/,
);
assert.match(
  mainQml,
  /onActivationRequested:\s*visibleItem\s*=>\s*\{[\s\S]*?taskActivation\.activateRemoteAttention\(visibleItem\);[\s\S]*?\}/,
);
assert.match(
  mainQml,
  /function activateTaskAtIndex\(index\)\s*\{\s*taskActivation\.activateTaskAtIndex\(index\);\s*\}/,
);
assert.doesNotMatch(mainQml, /function activateTaskEntry\(/);
assert.doesNotMatch(mainQml, /function activateRemoteAttention\(/);
assert.doesNotMatch(mainQml, /function requestActivation\(/);
assert.doesNotMatch(mainQml, /taskActivation\.requestActivation\(result\)/);
assert.doesNotMatch(
  mainQml,
  /TaskActionLogic\.shortcutActivationRequest\(visibleTaskItems,\s*index\)/,
);
assert.doesNotMatch(
  mainQml,
  /TaskActionLogic\.taskActivationRequest\("activateTask"/,
);
assert.doesNotMatch(
  mainQml,
  /TaskActionLogic\.taskActivationRequest\("activateRemoteAttention"/,
);
assert.doesNotMatch(
  mainQml,
  /taskActivation\.activateRemoteAttention\(root\.remoteAttentionVisibleItem\)/,
);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\)/,
);
assert.doesNotMatch(
  mainQml,
  /tasksModel\.requestActivate\(result\.modelIndex\)/,
);

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskActivationPort/);
assert.doesNotMatch(sourceQml, /property var taskModel/);
assert.match(sourceQml, /property var remoteAttentionSource/);
assert.match(sourceQml, /import "TaskActionLogic\.mjs" as TaskActionLogic/);
assert.match(
  sourceQml,
  /import "VisibleTaskItemsLogic\.mjs" as VisibleTaskItemsLogic/,
);
assert.match(sourceQml, /property var visibleTaskItems/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /function activateTaskAtIndex\(index\)/);
assert.match(
  sourceQml,
  /TaskActionLogic\.shortcutActivationRequest\(visibleTaskItems,\s*index\)/,
);
assert.match(sourceQml, /function activateTaskEntry\(task\)/);
assert.match(
  sourceQml,
  /TaskActionLogic\.taskActivationRequest\("activateTask",\s*task,/,
);
assert.match(sourceQml, /function activateRemoteAttention\(visibleItem\)/);
assert.match(
  sourceQml,
  /TaskActionLogic\.taskActivationRequest\("activateRemoteAttention",\s*visibleItem\s*\?\s*visibleItem\.entry\s*:\s*null,/,
);
assert.match(sourceQml, /actionResult\(result\)/);
assert.match(sourceQml, /function activationTarget\(result\)/);
assert.match(sourceQml, /function requestActivation\(result\)/);
assert.match(
  sourceQml,
  /result\.sourceModel === VisibleTaskItemsLogic\.remoteAttentionItemKind/,
);
assert.match(sourceQml, /return remoteAttentionSource/);
assert.match(sourceQml, /return taskActivationPort/);
assert.match(
  sourceQml,
  /TaskActionLogic\.activationExecutionResult\(result,\s*target\)/,
);
assert.match(sourceQml, /actionResult\(executionResult\)/);
assert.match(
  sourceQml,
  /try\s*\{[\s\S]*?target\.requestActivate\(result\.modelIndex\);[\s\S]*?\}\s*catch\s*\(error\)/,
);
assert.match(
  sourceQml,
  /TaskActionLogic\.activationExecutionResult\(result,\s*target,\s*error\)/,
);
assert.doesNotMatch(
  sourceQml,
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\);\s*return;[\s\S]*?taskModel\.requestActivate\(result\.modelIndex\);/,
);
