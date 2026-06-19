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
assert.match(mainQml, /\bLauncherCommandPort\s*\{/);
assert.match(mainQml, /id:\s*launcherCommandPort/);
assert.match(
  mainQml,
  /\bLauncherCommandPort\s*\{[\s\S]*?taskModel:\s*tasksModel[\s\S]*?\}/,
);
assert.match(mainQml, /launcherPort:\s*launcherCommandPort/);
assert.match(mainQml, /launcherSync:\s*launcherSync/);
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

assert.match(
  sourceQml,
  /import "LauncherCommandLogic\.mjs" as LauncherCommandLogic/,
);
assert.doesNotMatch(
  sourceQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var launcherPort/);
assert.match(sourceQml, /property var launcherSync/);
assert.doesNotMatch(sourceQml, /property var taskModel/);
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
  /LauncherCommandLogic\.contextMenuLauncherCommandDispatchResult\(command\)/,
);
assert.match(sourceQml, /LauncherCommandLogic\.launcherMutationRequest/);
assert.match(sourceQml, /LauncherCommandLogic\.launcherMutationResult/);
assert.match(
  sourceQml,
  /LauncherCommandLogic\.launcherMutationPersistenceResult/,
);
assert.match(sourceQml, /launcherPort\.requestAddLauncher\(url\)/);
assert.match(sourceQml, /launcherPort\.requestRemoveLauncher\(url\)/);
assert.doesNotMatch(sourceQml, /return false;/);
assert.doesNotMatch(sourceQml, /return true;/);
assert.match(
  sourceQml,
  /try\s*\{[\s\S]*?requestLauncher\(request\.launcherUrl\)[\s\S]*?\}\s*catch\s*\(error\)/,
);
assert.match(
  sourceQml,
  /LauncherCommandLogic\.launcherMutationResult\(request,\s*undefined,\s*error\)/,
);
assert.match(
  sourceQml,
  /const launcherList = launcherPort && launcherPort\.launcherList \? launcherPort\.launcherList : \[\];/,
);
assert.match(
  sourceQml,
  /if \(!launcherSync \|\| typeof launcherSync\.persistLaunchers !== "function"\)/,
);
assert.match(sourceQml, /missing-launcher-sync/);
assert.match(sourceQml, /launcher-persistence-threw/);
assert.match(sourceQml, /launcherSync\.persistLaunchers\(launcherList\)/);
assert.match(
  sourceQml,
  /const persistenceResult = LauncherCommandLogic\.launcherMutationPersistenceResult\(result, persistResult\);/,
);
assert.match(sourceQml, /if \(!persistenceResult\.ok\)/);
assert.match(sourceQml, /return persistenceResult;/);
assert.match(sourceQml, /return pinLauncher\(result\.launcherUrl\);/);
assert.match(sourceQml, /return unpinLauncher\(result\.launcherUrl\);/);
assert.match(sourceQml, /launcherSync\.applyLauncherList\(result\.launchers\)/);
assert.match(sourceQml, /actionResult\(result\)/);
