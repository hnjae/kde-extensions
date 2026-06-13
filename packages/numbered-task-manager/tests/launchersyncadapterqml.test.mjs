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
const sourceUrl = new URL(
  "../package/contents/ui/LauncherSyncAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bLauncherSyncAdapter\s*\{/);
assert.match(mainQml, /id:\s*launcherSync/);
assert.match(
  mainQml,
  /launcherSync\.persistLaunchers\(tasksModel\.launcherList\)/,
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

assert.match(sourceQml, /property var configuration/);
assert.match(sourceQml, /property var taskModel/);
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
assert.match(sourceQml, /function syncPorts\(\)/);
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
assert.match(
  sourceQml,
  /console\.warn\("Numbered Task Manager launcher sync "/,
);
