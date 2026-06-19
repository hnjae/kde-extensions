// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const shellUrl = new URL(
  "../package/contents/ui/TaskLikeItemShell.qml",
  import.meta.url,
);
const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);

assert.equal(existsSync(shellUrl), true);
const shellQml = readFileSync(shellUrl, "utf8");

assert.match(shellQml, /^QtQuick\.Item\s*\{/m);
assert.match(shellQml, /default property alias content:\s*contentRow\.data/);
assert.match(shellQml, /readonly property bool titleVisible:/);
assert.match(shellQml, /readonly property bool visualHighlighted:/);
assert.match(shellQml, /readonly property int iconExtent:/);
assert.match(shellQml, /readonly property real naturalImplicitWidth:/);
assert.match(shellQml, /implicitWidth:\s*TaskMetricsLogic\.taskImplicitWidth/);
assert.match(shellQml, /implicitHeight:\s*TaskMetricsLogic\.taskExtent\(\)/);
assert.match(shellQml, /TaskLikeFrame\s*\{/);
assert.match(shellQml, /TaskLikeContentRow\s*\{/);
assert.match(shellQml, /TaskLikeInteraction\s*\{/);

for (const source of [taskItemQml, attentionItemQml]) {
  assert.match(source, /TaskLikeItemShell\s*\{/);
  assert.doesNotMatch(source, /TaskLikeFrame\s*\{/);
  assert.doesNotMatch(source, /TaskLikeContentRow\s*\{/);
  assert.doesNotMatch(source, /TaskLikeInteraction\s*\{/);
  assert.doesNotMatch(
    source,
    /implicitWidth:\s*TaskMetricsLogic\.taskImplicitWidth/,
  );
  assert.doesNotMatch(
    source,
    /implicitHeight:\s*TaskMetricsLogic\.taskExtent\(\)/,
  );
}

assert.match(
  taskItemQml,
  /onActivated:\s*\{\s*root\.activated\(root\.taskIndex\);/,
);
assert.match(attentionItemQml, /onActivated:\s*\{\s*root\.activated\(\);/);
