// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskInteractionLogic.js", import.meta.url),
  ["canAcceptTaskDrop", "taskDragMimeData", "taskDropSourceIndex"],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(logic.taskDragMimeData("", 3)), {});
assert.deepEqual(plain(logic.taskDragMimeData("application/x-task", 3)), {
  "application/x-task": "3",
});
assert.deepEqual(plain(logic.taskDragMimeData("application/x-task", -1)), {
  "application/x-task": "-1",
});

assert.equal(logic.taskDropSourceIndex("7"), 7);
assert.equal(logic.taskDropSourceIndex("-1"), -1);
assert.equal(logic.taskDropSourceIndex("not-a-number"), -1);
assert.equal(logic.taskDropSourceIndex(null), -1);

assert.equal(
  logic.canAcceptTaskDrop(2, 2, () => true),
  false,
);
assert.equal(
  logic.canAcceptTaskDrop(-1, 2, () => true),
  false,
);
assert.equal(logic.canAcceptTaskDrop(1, 2, null), false);

let acceptedArgs = [];
assert.equal(
  logic.canAcceptTaskDrop(1, 2, (sourceIndex, targetIndex) => {
    acceptedArgs = [sourceIndex, targetIndex];
    return true;
  }),
  true,
);
assert.deepEqual(acceptedArgs, [1, 2]);
assert.equal(
  logic.canAcceptTaskDrop(1, 2, () => false),
  false,
);
