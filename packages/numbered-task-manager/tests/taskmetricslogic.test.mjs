// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskMetricsLogic.mjs", import.meta.url),
  [
    "adjustedFrameMargin",
    "attentionNaturalWidthMinimum",
    "iconExtentForTaskFrame",
    "maximumSlotWidth",
    "minimumReadableSlotWidth",
    "normalNaturalWidthMinimum",
    "taskExtent",
    "taskImplicitWidth",
    "taskNaturalImplicitWidth",
    "taskTitleVisible",
    "taskSlotWidth",
    "titleVisibilityThreshold",
  ],
);

assert.equal(logic.taskExtent(), 40);
assert.equal(logic.titleVisibilityThreshold(), 96);
assert.equal(logic.maximumSlotWidth(), 220);
assert.equal(logic.normalNaturalWidthMinimum(true), 96);
assert.equal(logic.normalNaturalWidthMinimum(false), 0);
assert.equal(logic.attentionNaturalWidthMinimum(), 112);
assert.equal(logic.minimumReadableSlotWidth(40, 4), 48);

assert.equal(logic.adjustedFrameMargin(56, 8, 4, 16), 4);
assert.equal(logic.adjustedFrameMargin(18, 8, 4, 16), 2);
assert.equal(logic.adjustedFrameMargin(0, 8, 4, 16), 4);

assert.equal(logic.iconExtentForTaskFrame(56, 4, 4, 16), 48);
assert.equal(logic.iconExtentForTaskFrame(40, 4, 4, 16), 32);
assert.equal(logic.iconExtentForTaskFrame(18, 4, 4, 16), 14);
assert.equal(logic.iconExtentForTaskFrame(0, 4, 4, 16), 0);

assert.equal(logic.taskTitleVisible(true, 0, 96), true);
assert.equal(logic.taskTitleVisible(true, -1, 96), true);
assert.equal(logic.taskTitleVisible(true, 95, 96), false);
assert.equal(logic.taskTitleVisible(true, 96, 96), true);
assert.equal(logic.taskTitleVisible(false, 120, 96), false);

assert.equal(logic.taskImplicitWidth(140, 220), 140);
assert.equal(logic.taskImplicitWidth(0, 220), 220);
assert.equal(logic.taskImplicitWidth(-1, 220), 220);

assert.equal(logic.taskNaturalImplicitWidth(96, 220, 80, 20), 100);
assert.equal(logic.taskNaturalImplicitWidth(112, 220, 80, 20), 112);
assert.equal(logic.taskNaturalImplicitWidth(96, 220, 240, 20), 220);

assert.equal(logic.taskSlotWidth(1200, 3, 48, 220), 220);
assert.equal(logic.taskSlotWidth(600, 4, 48, 220), 150);
assert.equal(logic.taskSlotWidth(250, 4, 80, 220), 80);
assert.equal(logic.taskSlotWidth(600, 0, 80, 220), 0);
assert.equal(logic.taskSlotWidth(0, 3, 80, 220), 80);
assert.equal(logic.taskSlotWidth("wide", 3, 80, 220), 80);
