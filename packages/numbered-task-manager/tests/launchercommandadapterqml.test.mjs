// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/LauncherCommandAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bLauncherCommandAdapter\s*\{/);
assert.match(mainQml, /id:\s*launcherCommands/);
assert.match(mainQml, /launcherSync:\s*launcherSync/);
assert.match(mainQml, /taskModel:\s*tasksModel/);
assert.match(mainQml, /launcherCommands\.dispatchLauncherCommand\(command\)/);
assert.match(mainQml, /actionLogger\.logActionResult\(result\)/);
assert.doesNotMatch(mainQml, /function pinLauncher\(/);
assert.doesNotMatch(mainQml, /function unpinLauncher\(/);
assert.doesNotMatch(mainQml, /function requestLauncherMutation\(/);
assert.doesNotMatch(mainQml, /function dispatchLauncherCommand\(/);
assert.doesNotMatch(
  mainQml,
  /TaskActionLogic\.contextMenuLauncherCommandDispatchResult/,
);
assert.doesNotMatch(mainQml, /TaskActionLogic\.launcherMutationRequest/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.launcherMutationResult/);

assert.match(sourceQml, /import "TaskActionLogic\.js" as TaskActionLogic/);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var launcherSync/);
assert.match(sourceQml, /property var taskModel/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /function pinLauncher\(launcherUrl\)/);
assert.match(sourceQml, /function unpinLauncher\(launcherUrl\)/);
assert.match(
  sourceQml,
  /function requestLauncherMutation\(action, launcherUrl, requestLauncher\)/,
);
assert.match(sourceQml, /function dispatchLauncherCommand\(command\)/);
assert.match(
  sourceQml,
  /TaskActionLogic\.contextMenuLauncherCommandDispatchResult\(command\)/,
);
assert.match(sourceQml, /TaskActionLogic\.launcherMutationRequest/);
assert.match(sourceQml, /TaskActionLogic\.launcherMutationResult/);
assert.match(sourceQml, /taskModel\.requestAddLauncher\(url\)/);
assert.match(sourceQml, /taskModel\.requestRemoveLauncher\(url\)/);
assert.match(
  sourceQml,
  /launcherSync\.persistLaunchers\(taskModel\.launcherList\)/,
);
assert.match(sourceQml, /launcherSync\.applyLauncherList\(result\.launchers\)/);
assert.match(sourceQml, /actionResult\(result\)/);
