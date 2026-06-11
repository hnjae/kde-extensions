// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/NormalTaskStoreAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bNormalTaskStoreAdapter\s*\{/);
assert.match(mainQml, /id:\s*normalTaskStore/);
assert.match(mainQml, /normalTaskStore\.entries/);
assert.match(mainQml, /normalTaskStore\.allocatePublicationKey\(\)/);
assert.match(
  mainQml,
  /normalTaskStore\.publishNormalTask\(key, qualifies, task\)/,
);
assert.match(mainQml, /normalTaskStore\.removeNormalTask\(key\)/);
assert.doesNotMatch(mainQml, /import "NormalTaskStoreLogic\.mjs"/);
assert.doesNotMatch(mainQml, /property var normalTaskStoreState/);
assert.doesNotMatch(mainQml, /function createNormalTaskPublicationKey\(/);
assert.doesNotMatch(mainQml, /function publishNormalTask\(/);
assert.doesNotMatch(mainQml, /function removeNormalTask\(/);
assert.doesNotMatch(mainQml, /function applyNormalTaskStore\(/);
assert.doesNotMatch(mainQml, /function recomputeNormalTaskEntries\(/);
assert.doesNotMatch(mainQml, /function moveManualTask\(/);
assert.doesNotMatch(mainQml, /NormalTaskStoreLogic\./);

assert.match(
  sourceQml,
  /import "NormalTaskStoreLogic\.mjs" as NormalTaskStoreLogic/,
);
assert.match(sourceQml, /import "TaskModelLogic\.mjs" as TaskModelLogic/);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(
  sourceQml,
  /property var storeState:\s*NormalTaskStoreLogic\.createNormalTaskStore\(\)/,
);
assert.match(sourceQml, /property var visibleLauncherPosition/);
assert.match(
  sourceQml,
  /readonly property var entries:\s*storeState\.entries \|\| \[\]/,
);
assert.match(sourceQml, /function allocatePublicationKey\(\)/);
assert.match(sourceQml, /function publishNormalTask\(key, qualifies, task\)/);
assert.match(sourceQml, /function removeNormalTask\(key\)/);
assert.match(sourceQml, /function recomputeEntries\(\)/);
assert.match(sourceQml, /function moveManualTask\(sourceKey, targetKey\)/);
assert.match(sourceQml, /NormalTaskStoreLogic\.allocateNormalTaskPublication/);
assert.match(sourceQml, /NormalTaskStoreLogic\.publishNormalTask/);
assert.match(sourceQml, /NormalTaskStoreLogic\.removeNormalTask/);
assert.match(sourceQml, /NormalTaskStoreLogic\.recomputeNormalTaskStore/);
assert.match(sourceQml, /TaskModelLogic\.moveManualTaskOrder/);
