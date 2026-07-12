// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceQml = readFileSync(
  new URL("../package/contents/ui/LauncherSyncAdapter.qml", import.meta.url),
  "utf8",
);

assert.match(mainQml, /\bLauncherSyncPort\s*\{/);
assert.match(mainQml, /\bLauncherSyncAdapter\s*\{/);
assert.match(mainQml, /launcherSync\.observeModelLauncherList\(launcherList\)/);
assert.match(mainQml, /if \(!launcherSync\.updatingLauncherConfig\)/);
assert.doesNotMatch(mainQml, /persistLaunchers|applyLauncherList/);

assert.match(sourceQml, /property var launcherSyncPort/);
assert.match(sourceQml, /property var launcherSyncState/);
assert.match(sourceQml, /property bool updatingLauncherConfig:\s*false/);
assert.match(sourceQml, /readonly property QtQuick\.Timer retryTimer/);
assert.match(sourceQml, /interval:\s*0/);
assert.match(sourceQml, /repeat:\s*false/);
assert.match(sourceQml, /function synchronizeLauncherList\(launchers, cause\)/);
assert.match(sourceQml, /function observeModelLauncherList\(modelLaunchers\)/);
assert.match(sourceQml, /function retryPendingLauncherSync\(\)/);
assert.match(sourceQml, /retryTimer\.restart\(\)/);
assert.match(sourceQml, /retryTimer\.stop\(\)/);
assert.doesNotMatch(sourceQml, /launcherReconciliationState/);
assert.doesNotMatch(
  sourceQml,
  /function (persistLaunchers|applyLauncherList|reconcileLauncherListChange)/,
);
