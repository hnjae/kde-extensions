// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskEntryDiagnosticReporter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");
const normalSourceQml = readFileSync(
  new URL("../package/contents/ui/NormalTaskSource.qml", import.meta.url),
  "utf8",
);
const remoteSourceQml = readFileSync(
  new URL("../package/contents/ui/RemoteAttentionSource.qml", import.meta.url),
  "utf8",
);

assert.match(sourceQml, /import "TaskActionLogic\.mjs" as TaskActionLogic/);
assert.match(sourceQml, /import "TaskEntryLogic\.mjs" as TaskEntryLogic/);
assert.match(sourceQml, /property string sourceModel:\s*""/);
assert.match(sourceQml, /property int sourceRow:\s*-1/);
assert.match(sourceQml, /property string publicationKey:\s*""/);
assert.match(sourceQml, /property var roles:\s*\(\{\}\)/);
assert.match(sourceQml, /property string lastDiagnosticSignature:\s*""/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /function emitDiagnostics\(\)/);
assert.match(sourceQml, /TaskEntryLogic\.taskEntryDiagnostics\(root\.roles/);
assert.match(sourceQml, /TaskActionLogic\.taskEntryDiagnosticResult\(/);
assert.doesNotMatch(
  sourceQml,
  /TaskActionLogic\.actionResult\("projectTaskEntry"/,
);
assert.match(sourceQml, /JSON\.stringify\(diagnostics\)/);

assert.match(normalSourceQml, /\bTaskEntryDiagnosticReporter\s*\{/);
assert.match(normalSourceQml, /id:\s*taskEntryDiagnostics/);
assert.match(
  normalSourceQml,
  /import "VisibleTaskItemsLogic\.mjs" as VisibleTaskItemsLogic/,
);
assert.match(
  normalSourceQml,
  /sourceModel:\s*VisibleTaskItemsLogic\.normalItemKind/,
);
assert.match(normalSourceQml, /sourceRow:\s*index/);
assert.match(normalSourceQml, /publicationKey:\s*publishedKey/);
assert.match(
  normalSourceQml,
  /roles:\s*\(\{[\s\S]*?activities:\s*model\.Activities[\s\S]*?demandingAttention:\s*model\.IsDemandingAttention[\s\S]*?index:[\s\S]*?isLauncher:\s*model\.IsLauncher[\s\S]*?isOnAllVirtualDesktops:\s*model\.IsOnAllVirtualDesktops[\s\S]*?isWindow:\s*model\.IsWindow[\s\S]*?modelIndex:\s*persistentModelIndex[\s\S]*?virtualDesktops:\s*model\.VirtualDesktops[\s\S]*?\}\)/,
);
assert.match(normalSourceQml, /taskEntryDiagnostics\.emitDiagnostics\(\)/);
assert.doesNotMatch(
  normalSourceQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.doesNotMatch(normalSourceQml, /lastDiagnosticSignature/);
assert.doesNotMatch(normalSourceQml, /function diagnosticResult/);
assert.doesNotMatch(normalSourceQml, /TaskEntryLogic\.taskEntryDiagnostics\(/);
assert.doesNotMatch(
  normalSourceQml,
  /TaskActionLogic\.actionResult\("projectTaskEntry"/,
);

assert.match(remoteSourceQml, /\bTaskEntryDiagnosticReporter\s*\{/);
assert.match(remoteSourceQml, /id:\s*taskEntryDiagnostics/);
assert.match(
  remoteSourceQml,
  /sourceModel:\s*VisibleTaskItemsLogic\.remoteAttentionItemKind/,
);
assert.match(remoteSourceQml, /sourceRow:\s*index/);
assert.match(remoteSourceQml, /publicationKey:\s*publishedKey/);
assert.match(
  remoteSourceQml,
  /roles:\s*\(\{[\s\S]*?activities:\s*model\.Activities[\s\S]*?demandingAttention:\s*model\.IsDemandingAttention[\s\S]*?index:[\s\S]*?isOnAllVirtualDesktops:\s*model\.IsOnAllVirtualDesktops[\s\S]*?isWindow:\s*model\.IsWindow[\s\S]*?modelIndex:\s*persistentModelIndex[\s\S]*?virtualDesktops:\s*model\.VirtualDesktops[\s\S]*?\}\)/,
);
assert.match(remoteSourceQml, /taskEntryDiagnostics\.emitDiagnostics\(\)/);
assert.doesNotMatch(
  remoteSourceQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.doesNotMatch(remoteSourceQml, /lastDiagnosticSignature/);
assert.doesNotMatch(remoteSourceQml, /function diagnosticResult/);
assert.doesNotMatch(remoteSourceQml, /TaskEntryLogic\.taskEntryDiagnostics\(/);
assert.doesNotMatch(
  remoteSourceQml,
  /TaskActionLogic\.actionResult\("projectTaskEntry"/,
);
