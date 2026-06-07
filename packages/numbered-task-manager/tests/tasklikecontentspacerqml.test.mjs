// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskLikeContentSpacer.qml",
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

assert.match(sourceQml, /^QtQuick\.Item\s*\{/m);
assert.match(sourceQml, /property bool fill:\s*false/);
assert.match(sourceQml, /visible:\s*root\.fill/);
assert.match(sourceQml, /QtQuickLayouts\.Layout\.fillWidth:\s*root\.fill/);

assert.equal(
  (taskItemQml.match(/\bTaskLikeContentSpacer\s*\{/g) || []).length,
  2,
);
assert.match(
  taskItemQml,
  /\bTaskLikeContentSpacer\s*\{[\s\S]*?fill:\s*!root\.titleVisible && !root\.pinnedLauncherOnly[\s\S]*?\}/,
);
assert.match(
  taskItemQml,
  /\bTaskLikeContentSpacer\s*\{[\s\S]*?fill:\s*!root\.titleVisible[\s\S]*?\}/,
);
assert.doesNotMatch(
  taskItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible && !root\.pinnedLauncherOnly/,
);
assert.doesNotMatch(
  taskItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible/,
);

assert.equal(
  (attentionItemQml.match(/\bTaskLikeContentSpacer\s*\{/g) || []).length,
  2,
);
assert.equal(
  (
    attentionItemQml.match(
      /\bTaskLikeContentSpacer\s*\{[\s\S]*?fill:\s*!root\.titleVisible[\s\S]*?\}/g,
    ) || []
  ).length,
  2,
);
assert.doesNotMatch(
  attentionItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible/,
);
