// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeFrame.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");
const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);

const frameStateProperties = [
  "active",
  "attention",
  "dropHover",
  "hovered",
  "launcher",
  "minimized",
  "mutedLauncher",
];

assert.match(sourceQml, /^QtQuick\.Item\s*\{/m);
assert.match(sourceQml, /\bTaskFrame\s*\{/);
assert.match(sourceQml, /id:\s*taskFrame/);
assert.match(sourceQml, /anchors\.fill:\s*parent/);
for (const propertyName of frameStateProperties) {
  assert.match(
    sourceQml,
    new RegExp(`property bool ${propertyName}:\\s*false`),
  );
  assert.match(
    sourceQml,
    new RegExp(`${propertyName}:\\s*root\\.${propertyName}`),
  );
}
for (const marginName of [
  "contentBottomMargin",
  "contentLeftMargin",
  "contentRightMargin",
  "contentTopMargin",
]) {
  assert.match(
    sourceQml,
    new RegExp(
      `readonly property real ${marginName}:\\s*taskFrame\\.${marginName}`,
    ),
  );
}

assert.match(taskItemQml, /\bTaskLikeFrame\s*\{/);
assert.match(taskItemQml, /id:\s*taskFrame/);
assert.match(taskItemQml, /active:\s*root\.active/);
assert.match(taskItemQml, /attention:\s*root\.demandingAttention/);
assert.match(taskItemQml, /dropHover:\s*root\.dropHover/);
assert.match(taskItemQml, /hovered:\s*root\.visualHighlighted/);
assert.match(taskItemQml, /launcher:\s*root\.launcher/);
assert.match(taskItemQml, /minimized:\s*root\.minimized/);
assert.match(taskItemQml, /mutedLauncher:\s*root\.pinnedLauncherOnly/);
assert.doesNotMatch(taskItemQml, /\bTaskFrame\s*\{/);

assert.match(attentionItemQml, /\bTaskLikeFrame\s*\{/);
assert.match(attentionItemQml, /id:\s*taskFrame/);
assert.match(attentionItemQml, /attention:\s*true/);
assert.match(attentionItemQml, /hovered:\s*root\.visualHighlighted/);
assert.doesNotMatch(attentionItemQml, /\bTaskFrame\s*\{/);
