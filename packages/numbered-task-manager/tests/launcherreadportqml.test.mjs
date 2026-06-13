// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/LauncherReadPort.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskModel/);
assert.match(
  sourceQml,
  /readonly property var launcherList:\s*taskModel && taskModel\.launcherList \? taskModel\.launcherList : \[\]/,
);
assert.match(sourceQml, /function launcherPosition\(launcherUrl\)/);
assert.match(sourceQml, /return taskModel\.launcherPosition\(launcherUrl\);/);
assert.match(sourceQml, /function launcherActivities\(launcherUrl\)/);
assert.match(sourceQml, /return taskModel\.launcherActivities\(launcherUrl\);/);
assert.doesNotMatch(sourceQml, /requestAddLauncher/);
assert.doesNotMatch(sourceQml, /requestRemoveLauncher/);
