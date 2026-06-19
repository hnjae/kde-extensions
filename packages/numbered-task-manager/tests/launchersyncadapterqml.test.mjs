// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const moveAdapterQml = readFileSync(
  new URL("../package/contents/ui/TaskMoveAdapter.qml", import.meta.url),
  "utf8",
);
const portUrl = new URL(
  "../package/contents/ui/LauncherSyncPort.qml",
  import.meta.url,
);
const sourceUrl = new URL(
  "../package/contents/ui/LauncherSyncAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(portUrl), true);
assert.equal(existsSync(sourceUrl), true);

const portQml = readFileSync(portUrl, "utf8");
const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bLauncherSyncPort\s*\{/);
assert.match(mainQml, /id:\s*launcherSyncPort/);
assert.match(
  mainQml,
  /\bLauncherSyncPort\s*\{[\s\S]*?configuration:\s*Plasmoid\.configuration[\s\S]*?taskModel:\s*tasksModel[\s\S]*?\}/,
);
assert.match(mainQml, /\bLauncherSyncAdapter\s*\{/);
assert.match(mainQml, /id:\s*launcherSync/);
assert.match(mainQml, /launcherSyncPort:\s*launcherSyncPort/);
assert.match(
  mainQml,
  /onActionResult:\s*result\s*=>\s*\{[\s\S]*?actionLogger\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.match(
  mainQml,
  /launcherSync\.persistLaunchers\(launcherSyncPort\.modelLaunchers\)/,
);
assert.match(
  moveAdapterQml,
  /launcherSync\.applyLauncherList\(result\.launchers\)/,
);
assert.match(mainQml, /if \(!launcherSync\.updatingLauncherConfig\)/);
assert.match(
  mainQml,
  /launcherSync\.reconcileLauncherListChange\(launcherList\)/,
);
assert.doesNotMatch(mainQml, /property var launcherReconciliationState/);
assert.doesNotMatch(mainQml, /property bool updatingLauncherConfig/);
assert.doesNotMatch(mainQml, /function persistLaunchers\(/);
assert.doesNotMatch(mainQml, /function applyLauncherList\(/);
assert.doesNotMatch(mainQml, /function recordLauncherSyncResult\(/);
assert.doesNotMatch(mainQml, /function reconcileLauncherListChange\(/);
assert.doesNotMatch(mainQml, /function logLauncherSyncResult\(/);
assert.doesNotMatch(
  mainQml,
  /LauncherListLogic\.runLauncherListUpdateTransaction/,
);
assert.doesNotMatch(
  mainQml,
  /LauncherListLogic\.launcherReconciliationDecision/,
);

assert.match(portQml, /property var configuration/);
assert.match(portQml, /property var taskModel/);
assert.match(
  portQml,
  /readonly property var configLaunchers:\s*configuration && configuration\.launchers \? configuration\.launchers : \[\]/,
);
assert.match(
  portQml,
  /readonly property var modelLaunchers:\s*taskModel && taskModel\.launcherList \? taskModel\.launcherList : \[\]/,
);
assert.match(portQml, /function writeConfigLaunchers\(launchers\)/);
assert.match(portQml, /configuration\.launchers = launchers/);
assert.match(portQml, /function writeModelLaunchers\(launchers\)/);
assert.match(portQml, /taskModel\.launcherList = launchers/);

assert.match(sourceQml, /property var launcherSyncPort/);
assert.doesNotMatch(sourceQml, /property var taskModel/);
assert.doesNotMatch(sourceQml, /property var configuration/);
assert.doesNotMatch(sourceQml, /taskModel\.launcherList/);
assert.doesNotMatch(sourceQml, /configuration\.launchers/);
assert.match(sourceQml, /import "LauncherSyncLogic\.mjs" as LauncherSyncLogic/);
assert.doesNotMatch(
  sourceQml,
  /import "LauncherListLogic\.mjs" as LauncherListLogic/,
);
assert.match(sourceQml, /property var launcherSyncState/);
assert.match(
  sourceQml,
  /property var launcherReconciliationState:\s*launcherSyncState\.reconciliation/,
);
assert.match(sourceQml, /property bool updatingLauncherConfig:\s*false/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /function syncPorts\(\)/);
assert.match(
  sourceQml,
  /readConfigLaunchers:\s*\(\) => root\.launcherSyncPort\.configLaunchers/,
);
assert.match(
  sourceQml,
  /readModelLaunchers:\s*\(\) => root\.launcherSyncPort\.modelLaunchers/,
);
assert.match(
  sourceQml,
  /root\.launcherSyncPort\.writeConfigLaunchers\(launchers\)/,
);
assert.match(
  sourceQml,
  /root\.launcherSyncPort\.writeModelLaunchers\(launchers\)/,
);
assert.match(sourceQml, /function persistLaunchers\(launchers\)/);
assert.match(sourceQml, /function applyLauncherList\(launchers\)/);
assert.match(sourceQml, /function recordLauncherSyncResult\(action, result\)/);
assert.match(
  sourceQml,
  /function reconcileLauncherListChange\(modelLaunchers\)/,
);
assert.match(sourceQml, /function logLauncherSyncResult\(action, result\)/);
assert.match(
  sourceQml,
  /LauncherSyncLogic\.persistLaunchers\(launchers, syncPorts\(\), launcherSyncState\)/,
);
assert.match(
  sourceQml,
  /LauncherSyncLogic\.applyLauncherList\(launchers, syncPorts\(\), launcherSyncState\)/,
);
assert.match(
  sourceQml,
  /LauncherSyncLogic\.reconcileLauncherListChange\(modelLaunchers, syncPorts\(\), launcherSyncState\)/,
);
assert.doesNotMatch(
  sourceQml,
  /LauncherListLogic\.runLauncherListUpdateTransaction/,
);
assert.doesNotMatch(
  sourceQml,
  /LauncherListLogic\.launcherReconciliationDecision/,
);
assert.doesNotMatch(
  sourceQml,
  /LauncherListLogic\.launcherReconciliationAfterResult/,
);
assert.doesNotMatch(
  sourceQml,
  /console\.warn\("Numbered Task Manager launcher sync "/,
);
assert.match(
  sourceQml,
  /LauncherSyncLogic\.launcherSyncActionResult\(action,\s*result\)/,
);
assert.match(sourceQml, /actionResult\(syncActionResult\)/);
assert.doesNotMatch(
  sourceQml,
  /retryClassification:\s*result\.retryClassification \|\| ""/,
);
