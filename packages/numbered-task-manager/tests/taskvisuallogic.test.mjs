// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskVisualLogic.js", import.meta.url),
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

const taskFrameQml = readFileSync(
  new URL("../package/contents/ui/TaskFrame.qml", import.meta.url),
  "utf8",
);
assert.match(taskFrameQml, /KSvg\.FrameSvgItem/);
assert.match(taskFrameQml, /imagePath:\s*"widgets\/tasks"/);
assert.match(taskFrameQml, /property bool mutedLauncher:\s*false/);
assert.match(taskFrameQml, /opacity:\s*TaskVisualLogic\.frameOpacity\(\{/);

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
assert.match(mainQml, /import org\.kde\.plasma\.core as PlasmaCore/);
assert.match(
  mainQml,
  /readonly property bool vertical:\s*Plasmoid\.formFactor === PlasmaCore\.Types\.Vertical/,
);
assert.match(mainQml, /Plasmoid\.constraintHints:\s*Plasmoid\.CanFillArea/);
assert.match(
  mainQml,
  /preferredRepresentation:\s*root\.fullRepresentation[\s\S]*?QtQuickLayouts\.Layout\.fillWidth:\s*true[\s\S]*?QtQuickLayouts\.Layout\.fillHeight:\s*true[\s\S]*?function activateTaskAtIndex/,
);
assert.match(
  mainQml,
  /fullRepresentation:\s*QtQuick\.Item\s*\{[\s\S]*?QtQuickLayouts\.Layout\.fillWidth:\s*true[\s\S]*?QtQuickLayouts\.Layout\.fillHeight:\s*true[\s\S]*?QtQuickLayouts\.Layout\.minimumWidth:\s*0[\s\S]*?QtQuickLayouts\.Layout\.minimumHeight:\s*0/,
);
assert.match(
  mainQml,
  /orientation:\s*root\.vertical\s*\?\s*QtQuick\.ListView\.Vertical\s*:\s*QtQuick\.ListView\.Horizontal/,
);
assert.match(
  mainQml,
  /height:\s*root\.vertical\s*\?\s*implicitHeight\s*:\s*taskList\.height/,
);
assert.match(
  mainQml,
  /width:\s*root\.vertical\s*\?\s*taskList\.width\s*:\s*fullRepresentationItem\.taskSlotWidth/,
);
assert.match(mainQml, /visibleItemCount:\s*root\.visibleTaskItems\.length/);
assert.match(
  mainQml,
  /readonly property var remoteAttentionVisibleItem:\s*VisibleTaskItemsLogic\.visibleRemoteAttentionItem\(root\.visibleTaskItems\)/,
);
assert.doesNotMatch(mainQml, /root\.remoteAttentionState\.target\s*\?/);
assert.match(
  mainQml,
  /slotWidth:\s*root\.vertical\s*\?\s*0\s*:\s*fullRepresentationItem\.taskSlotWidth/,
);
assert.match(mainQml, /function canMoveTaskResult\(sourceIndex, targetIndex\)/);
assert.match(
  mainQml,
  /return TaskModelLogic\.canMoveTaskResult\(normalTaskEntries, sourceIndex, targetIndex, \(sourceEntry, targetEntry\) => canMovePinnedLauncher\(sourceEntry, targetEntry\)\);/,
);
assert.match(
  mainQml,
  /function canMoveTask\(sourceIndex, targetIndex\)\s*\{[\s\S]*?return canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove;/,
);
assert.match(
  mainQml,
  /const moveDecision = canMoveTaskResult\(sourceIndex, targetIndex\);[\s\S]*?if \(!moveDecision\.canMove\)/,
);
assert.match(
  mainQml,
  /canDropTask:\s*\(sourceIndex, targetIndex\) => root\.canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove/,
);
assert.doesNotMatch(
  mainQml,
  /canDropTask:\s*\(sourceIndex, targetIndex\) => root\.canMoveTask\(sourceIndex, targetIndex\)/,
);
assert.match(mainQml, /columnSpacing:\s*0/);
assert.match(mainQml, /rowSpacing:\s*0/);
assert.match(mainQml, /^\s*spacing:\s*0$/m);

const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
assert.match(taskItemQml, /\bTaskFrame\s*\{/);
assert.match(taskItemQml, /property bool pinnedLauncherOnly:\s*false/);
assert.match(taskItemQml, /mutedLauncher:\s*root\.pinnedLauncherOnly/);
assert.match(taskItemQml, /readonly property bool visualHighlighted:/);
assert.match(taskItemQml, /readonly property bool titleVisible:/);
assert.match(taskItemQml, /TaskVisualLogic\.iconActive\(\{/);
assert.match(
  taskItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible && !root\.pinnedLauncherOnly/,
);
assert.match(taskItemQml, /opacity:\s*TaskVisualLogic\.contentOpacity\(\{/);
assert.doesNotMatch(taskItemQml, /QtQuick\.Rectangle\s*\{/);

const attentionItemQml = readFileSync(
  new URL("../package/contents/ui/AttentionItem.qml", import.meta.url),
  "utf8",
);
assert.match(attentionItemQml, /\bTaskFrame\s*\{/);
assert.match(attentionItemQml, /readonly property bool visualHighlighted:/);
assert.match(attentionItemQml, /readonly property bool titleVisible:/);
assert.match(attentionItemQml, /TaskVisualLogic\.iconActive\(\{/);
assert.match(
  attentionItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible/,
);
assert.doesNotMatch(attentionItemQml, /QtQuick\.Rectangle\s*\{/);
