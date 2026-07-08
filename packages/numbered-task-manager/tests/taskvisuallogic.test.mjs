// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskVisualLogic.mjs", import.meta.url),
  [
    "baseFramePrefix",
    "contentOpacity",
    "framePrefixes",
    "frameOpacity",
    "hoveredFramePrefixes",
    "iconActive",
    "taskPrefix",
  ],
);

const edges = {
  LeftEdge: 1,
  TopEdge: 2,
  RightEdge: 3,
};

function assertArrayEqual(actual, expected) {
  assert.deepEqual(Array.from(actual), expected);
}

assert.equal(logic.baseFramePrefix({ active: true }), "focus");
assert.equal(logic.baseFramePrefix({ minimized: true }), "minimized");
assert.equal(logic.baseFramePrefix({ demandingAttention: true }), "attention");
assert.equal(logic.baseFramePrefix({ attention: true }), "attention");
assert.equal(logic.baseFramePrefix({ dropHover: true }), "attention");
assert.equal(
  logic.baseFramePrefix({ launcher: true, mutedLauncher: true }),
  "minimized",
);
assert.equal(logic.baseFramePrefix({ launcher: true }), "");
assert.equal(logic.baseFramePrefix({}), "normal");
assert.equal(logic.iconActive({ active: true, highlighted: false }), false);
assert.equal(logic.iconActive({ active: false, highlighted: true }), true);
assert.equal(logic.iconActive({ active: true, highlighted: true }), true);
assert.equal(logic.iconActive({}), false);
assert.equal(logic.frameOpacity({ mutedLauncher: true }), 0.55);
assert.equal(logic.contentOpacity({ mutedLauncher: true }), 0.78);
assert.equal(logic.frameOpacity({ mutedLauncher: true, hovered: true }), 1);
assert.equal(
  logic.contentOpacity({ mutedLauncher: true, highlighted: true }),
  1,
);
assert.equal(logic.frameOpacity({ mutedLauncher: true, dropHover: true }), 1);
assert.equal(logic.contentOpacity({ minimized: true }), 1);

assertArrayEqual(logic.taskPrefix("focus", undefined, edges), [
  "south-focus",
  "focus",
]);
assertArrayEqual(logic.taskPrefix("focus", edges.TopEdge, edges), [
  "north-focus",
  "focus",
]);
assertArrayEqual(logic.taskPrefix("focus", edges.LeftEdge, edges), [
  "west-focus",
  "focus",
]);
assertArrayEqual(logic.taskPrefix("focus", edges.RightEdge, edges), [
  "east-focus",
  "focus",
]);

assertArrayEqual(logic.hoveredFramePrefixes("focus", undefined, edges), [
  "south-focus-hover",
  "focus-hover",
  "south-hover",
  "hover",
  "south-focus",
  "focus",
]);
assertArrayEqual(logic.hoveredFramePrefixes("", edges.TopEdge, edges), [
  "north-launcher-hover",
  "launcher-hover",
  "north-",
  "",
]);
assertArrayEqual(
  logic.framePrefixes(
    {
      active: true,
      hovered: true,
    },
    edges.LeftEdge,
    edges,
  ),
  [
    "west-focus-hover",
    "focus-hover",
    "west-hover",
    "hover",
    "west-focus",
    "focus",
  ],
);
assertArrayEqual(
  logic.framePrefixes(
    {
      launcher: true,
      mutedLauncher: true,
      hovered: true,
    },
    edges.LeftEdge,
    edges,
  ),
  [
    "west-minimized-hover",
    "minimized-hover",
    "west-hover",
    "hover",
    "west-minimized",
    "minimized",
  ],
);
