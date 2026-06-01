// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/BadgeDisplayLogic.js", import.meta.url),
  ["badgePresentation", "iconExtentForTaskHeight"],
);

assert.equal(logic.iconExtentForTaskHeight(40), 32);
assert.equal(logic.iconExtentForTaskHeight(31), 23);
assert.equal(logic.badgePresentation(1, 24), "overlay");
assert.equal(logic.badgePresentation(9, 32), "overlay");
assert.equal(logic.badgePresentation(1, 23), "prefix");
assert.equal(logic.badgePresentation(0, 32), "none");
assert.equal(logic.badgePresentation(10, 32), "none");

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
  /badgePresentation\(root\.slotNumber,\s*root\.iconExtent\)/,
);
