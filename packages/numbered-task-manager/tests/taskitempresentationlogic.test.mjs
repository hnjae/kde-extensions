// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskItemPresentationLogic.js",
    import.meta.url,
  ),
  ["taskItemPresentation"],
);

function presentation({
  slotNumber = 1,
  frameExtent,
  contentStartMargin = 4,
  contentEndMargin = 4,
  minimumIconExtent = 16,
}) {
  return logic.taskItemPresentation({
    contentEndMargin,
    contentStartMargin,
    frameExtent,
    minimumIconExtent,
    slotNumber,
  });
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
assert.match(taskItemQml, /id:\s*iconOverlayContainer/);
assert.match(taskItemQml, /z:\s*1/);
assert.match(
  taskItemQml,
  /import "TaskItemPresentationLogic\.js" as TaskItemPresentationLogic/,
);
assert.match(taskItemQml, /TaskItemPresentationLogic\.taskItemPresentation\(/);
assert.doesNotMatch(taskItemQml, /BadgeDisplayLogic/);
