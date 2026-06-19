// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskItemPresentationLogic.mjs",
    import.meta.url,
  ),
  ["taskItemPresentation"],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

function presentation({
  slotNumber = 1,
  frameExtent,
  contentStartMargin = 4,
  contentEndMargin = 4,
  minimumIconExtent = 16,
}) {
  return plain(
    logic.taskItemPresentation({
      contentEndMargin,
      contentStartMargin,
      frameExtent,
      minimumIconExtent,
      slotNumber,
    }),
  );
}

assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 32 }),
  {
    iconExtent: 32,
    numberMode: "prefix",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 32 }), {
  iconExtent: 24,
  numberMode: "prefix",
  slotLabel: "1",
});
assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 39 }),
  {
    iconExtent: 39,
    numberMode: "prefix",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 40 }), {
  iconExtent: 32,
  numberMode: "overlay",
  slotLabel: "1",
});
assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 40 }),
  {
    iconExtent: 40,
    numberMode: "overlay",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 40, slotNumber: 0 }), {
  iconExtent: 32,
  numberMode: "none",
  slotLabel: "",
});
assert.deepEqual(presentation({ frameExtent: 40, slotNumber: 10 }), {
  iconExtent: 32,
  numberMode: "none",
  slotLabel: "",
});

const numberBadgeQml = readFileSync(
  new URL("../package/contents/ui/NumberBadge.qml", import.meta.url),
  "utf8",
);
assert.match(numberBadgeQml, /^\s*width:\s*implicitWidth/m);
assert.match(numberBadgeQml, /^\s*height:\s*implicitHeight/m);

const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
const shellQml = readFileSync(
  new URL("../package/contents/ui/TaskLikeItemShell.qml", import.meta.url),
  "utf8",
);
assert.match(taskItemQml, /\bTaskLikeIconSlot\s*\{/);
assert.match(taskItemQml, /property real slotWidth:\s*0/);
assert.match(taskItemQml, /property bool showTitle:\s*true/);
assert.match(taskItemQml, /property bool pinnedLauncherOnly:\s*false/);
assert.match(taskItemQml, /import "TaskMetricsLogic\.mjs" as TaskMetricsLogic/);
assert.match(
  taskItemQml,
  /property int titleVisibilityThreshold:\s*TaskMetricsLogic\.titleVisibilityThreshold\(\)/,
);
assert.match(
  taskItemQml,
  /TaskMetricsLogic\.normalNaturalWidthMinimum\(root\.showTitle\)/,
);
assert.match(
  shellQml,
  /TaskMetricsLogic\.taskTitleVisible\(root\.showTitle, root\.slotWidth, root\.titleVisibilityThreshold\)/,
);
assert.match(taskItemQml, /visible:\s*root\.titleVisible/);
assert.match(
  taskItemQml,
  /fill:\s*!root\.titleVisible && !root\.pinnedLauncherOnly/,
);
assert.match(
  taskItemQml,
  /contentOpacity:\s*TaskVisualLogic\.contentOpacity\(\{/,
);
assert.match(taskItemQml, /z:\s*1/);
assert.match(
  taskItemQml,
  /import "TaskItemPresentationLogic\.mjs" as TaskItemPresentationLogic/,
);
assert.match(taskItemQml, /TaskItemPresentationLogic\.taskItemPresentation\(/);
assert.doesNotMatch(taskItemQml, /BadgeDisplayLogic/);

const normalTaskItemQml = readFileSync(
  new URL("../package/contents/ui/NormalTaskItem.qml", import.meta.url),
  "utf8",
);
assert.match(
  normalTaskItemQml,
  /showTitle:\s*!\(root\.entry\.launcherBacked && root\.entry\.isLauncher\)/,
);
assert.match(
  normalTaskItemQml,
  /pinnedLauncherOnly:\s*root\.entry\.launcherBacked && root\.entry\.isLauncher/,
);
assert.match(
  normalTaskItemQml,
  /slotWidth:\s*root\.vertical\s*\?\s*0\s*:\s*root\.taskSlotWidth/,
);
