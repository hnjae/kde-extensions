// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskActionResultLogger.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskActionResultLogger\s*\{/);
assert.match(mainQml, /id:\s*actionLogger/);
assert.match(mainQml, /actionLogger\.logActionResult\(result\)/);
assert.doesNotMatch(
  mainQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.doesNotMatch(mainQml, /function logActionResult\(/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.shouldLogActionResult/);
assert.doesNotMatch(mainQml, /console\.warn\("Numbered Task Manager action "/);
assert.doesNotMatch(mainQml, /root\.logActionResult\(result\)/);

assert.match(sourceQml, /import "ActionResultLogic\.mjs" as ActionResultLogic/);
assert.doesNotMatch(
  sourceQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /function logActionResult\(result\)/);
assert.match(sourceQml, /ActionResultLogic\.shouldLogActionResult\(result\)/);
assert.match(
  sourceQml,
  /console\.warn\("Numbered Task Manager action " \+ result\.action/,
);
