// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/NormalTaskSource.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bNormalTaskSource\s*\{/);
assert.match(
  mainQml,
  /\bNormalTaskSource\s*\{[\s\S]*?onActionResult:\s*result\s*=>\s*\{[\s\S]*?actionLogger\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.doesNotMatch(
  mainQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*tasksModel[\s\S]*?publishNormalTask/,
);
assert.match(
  sourceQml,
  /QtQuick\.Repeater\s*\{[\s\S]*?model:\s*root\.taskModel/,
);
assert.match(sourceQml, /signal taskPublished\(/);
assert.match(sourceQml, /signal taskRemoved\(/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /\bTaskEntryDiagnosticReporter\s*\{/);
assert.match(
  sourceQml,
  /roles:\s*\(\{[\s\S]*?activities:\s*model\.Activities[\s\S]*?demandingAttention:\s*model\.IsDemandingAttention[\s\S]*?index:[\s\S]*?isOnAllVirtualDesktops:\s*model\.IsOnAllVirtualDesktops[\s\S]*?isWindow:\s*model\.IsWindow[\s\S]*?modelIndex:\s*persistentModelIndex[\s\S]*?virtualDesktops:\s*model\.VirtualDesktops[\s\S]*?\}\)/,
);
assert.match(sourceQml, /taskEntryDiagnostics\.emitDiagnostics\(\)/);
