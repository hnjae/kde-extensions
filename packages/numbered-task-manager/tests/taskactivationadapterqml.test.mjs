// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
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
assert.match(mainQml, /taskModel:\s*tasksModel/);
assert.match(mainQml, /remoteAttentionSource:\s*remoteAttentionSource/);
assert.match(mainQml, /visibleTaskItems:\s*root\.visibleTaskItems/);
assert.match(
  mainQml,
  /onActionResult:\s*result\s*=>\s*\{[\s\S]*?root\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.match(mainQml, /taskActivation\.activateTaskAtIndex\(/);
assert.match(mainQml, /taskActivation\.activateTaskEntry\(entry\)/);
assert.match(
  mainQml,
  /taskActivation\.activateRemoteAttention\(root\.remoteAttentionVisibleItem\)/,
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
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\)/,
);
assert.doesNotMatch(
  mainQml,
  /tasksModel\.requestActivate\(result\.modelIndex\)/,
);

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskModel/);
assert.match(sourceQml, /property var remoteAttentionSource/);
assert.match(sourceQml, /import "TaskActionLogic\.js" as TaskActionLogic/);
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
assert.match(sourceQml, /function requestActivation\(result\)/);
assert.match(sourceQml, /result\.sourceModel === "remoteAttention"/);
assert.match(
  sourceQml,
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\)/,
);
assert.match(sourceQml, /taskModel\.requestActivate\(result\.modelIndex\)/);
