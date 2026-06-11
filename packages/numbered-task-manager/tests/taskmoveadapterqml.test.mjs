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
  "../package/contents/ui/TaskMoveAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskMoveAdapter\s*\{/);
assert.match(mainQml, /id:\s*taskMover/);
assert.match(mainQml, /launcherSync:\s*launcherSync/);
assert.match(mainQml, /normalEntries:\s*root\.normalTaskEntries/);
assert.match(mainQml, /normalTaskStore:\s*normalTaskStore/);
assert.match(mainQml, /taskModel:\s*tasksModel/);
assert.doesNotMatch(
  mainQml,
  /taskMover\.canMoveTaskResult\(sourceIndex, targetIndex\)/,
);
assert.doesNotMatch(mainQml, /taskMover\.moveTask\(sourceIndex, targetIndex\)/);
assert.match(
  normalTaskItemQml,
  /root\.moveAdapter\.canMoveTaskResult\(sourceIndex, targetIndex\)/,
);
assert.match(
  normalTaskItemQml,
  /root\.moveAdapter\.moveTask\(sourceIndex, targetIndex\)/,
);
assert.match(mainQml, /actionLogger\.logActionResult\(result\)/);
assert.doesNotMatch(mainQml, /import "TaskModelLogic\.mjs" as TaskModelLogic/);
assert.doesNotMatch(mainQml, /function moveTask\(/);
assert.doesNotMatch(mainQml, /function movePinnedLauncher\(/);
assert.doesNotMatch(mainQml, /function canMovePinnedLauncher\(/);
assert.doesNotMatch(mainQml, /function canMoveTaskResult\(/);
assert.doesNotMatch(mainQml, /function canMoveTask\(/);
assert.doesNotMatch(mainQml, /function normalTaskEntryForSourceIndex\(/);
assert.doesNotMatch(mainQml, /TaskModelLogic\.canMoveTaskResult/);
assert.doesNotMatch(mainQml, /TaskModelLogic\.normalTaskEntryForSourceIndex/);
assert.doesNotMatch(mainQml, /LauncherListLogic\.movePinnedLauncher/);
assert.doesNotMatch(mainQml, /LauncherListLogic\.canMovePinnedLauncher/);

assert.match(sourceQml, /import "LauncherListLogic\.mjs" as LauncherListLogic/);
assert.match(sourceQml, /import "TaskActionLogic\.mjs" as TaskActionLogic/);
assert.match(sourceQml, /import "TaskModelLogic\.mjs" as TaskModelLogic/);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var launcherSync/);
assert.match(sourceQml, /property var normalEntries:\s*\[\]/);
assert.match(sourceQml, /property var normalTaskStore/);
assert.match(sourceQml, /property var taskModel/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /function moveTask\(sourceIndex, targetIndex\)/);
assert.match(
  sourceQml,
  /function movePinnedLauncher\(sourceEntry, targetEntry\)/,
);
assert.match(
  sourceQml,
  /function canMovePinnedLauncher\(sourceEntry, targetEntry\)/,
);
assert.match(
  sourceQml,
  /function canMoveTaskResult\(sourceIndex, targetIndex\)/,
);
assert.match(sourceQml, /function canMoveTask\(sourceIndex, targetIndex\)/);
assert.match(
  sourceQml,
  /function normalTaskEntryForSourceIndex\(sourceIndex\)/,
);
assert.match(sourceQml, /TaskActionLogic\.dragMoveRejectionResult/);
assert.match(sourceQml, /TaskModelLogic\.canMoveTaskResult/);
assert.match(sourceQml, /TaskModelLogic\.normalTaskEntryForSourceIndex/);
assert.match(sourceQml, /normalTaskStore\.moveManualTask/);
assert.match(sourceQml, /LauncherListLogic\.movePinnedLauncher/);
assert.match(sourceQml, /LauncherListLogic\.canMovePinnedLauncher/);
assert.match(sourceQml, /launcherSync\.applyLauncherList\(result\.launchers\)/);
