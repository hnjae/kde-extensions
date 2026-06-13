// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskActivationPort.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskModel/);
assert.match(sourceQml, /function requestActivate\(modelIndex\)/);
assert.match(sourceQml, /taskModel\.requestActivate\(modelIndex\)/);
assert.doesNotMatch(sourceQml, /requestAddLauncher/);
assert.doesNotMatch(sourceQml, /requestRemoveLauncher/);
assert.doesNotMatch(sourceQml, /requestNewInstance/);
assert.doesNotMatch(sourceQml, /launcherList/);
