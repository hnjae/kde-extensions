// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskVisualLogic.js", import.meta.url),
  ["baseFramePrefix", "framePrefixes", "hoveredFramePrefixes", "taskPrefix"],
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
assert.equal(logic.baseFramePrefix({ launcher: true }), "");
assert.equal(logic.baseFramePrefix({}), "normal");

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

const taskFrameQml = readFileSync(
  new URL("../package/contents/ui/TaskFrame.qml", import.meta.url),
  "utf8",
);
assert.match(taskFrameQml, /KSvg\.FrameSvgItem/);
assert.match(taskFrameQml, /imagePath:\s*"widgets\/tasks"/);

for (const fileName of ["TaskItem.qml", "AttentionItem.qml"]) {
  const qml = readFileSync(
    new URL(`../package/contents/ui/${fileName}`, import.meta.url),
    "utf8",
  );
  assert.match(qml, /\bTaskFrame\s*\{/);
  assert.doesNotMatch(qml, /QtQuick\.Rectangle\s*\{/);
}
