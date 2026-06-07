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
const taskListRepresentationQml = readFileSync(
  new URL("../package/contents/ui/TaskListRepresentation.qml", import.meta.url),
  "utf8",
);
const normalTaskItemQml = readFileSync(
  new URL("../package/contents/ui/NormalTaskItem.qml", import.meta.url),
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
  /preferredRepresentation:\s*root\.fullRepresentation[\s\S]*?fullRepresentation:\s*TaskListRepresentation\s*\{/,
);
assert.match(
  taskListRepresentationQml,
  /^QtQuick\.Item\s*\{[\s\S]*?QtQuickLayouts\.Layout\.fillWidth:\s*true[\s\S]*?QtQuickLayouts\.Layout\.fillHeight:\s*true[\s\S]*?QtQuickLayouts\.Layout\.minimumWidth:\s*0[\s\S]*?QtQuickLayouts\.Layout\.minimumHeight:\s*0/m,
);
assert.match(
  taskListRepresentationQml,
  /orientation:\s*root\.vertical\s*\?\s*QtQuick\.ListView\.Vertical\s*:\s*QtQuick\.ListView\.Horizontal/,
);
assert.match(
  normalTaskItemQml,
  /height:\s*root\.vertical\s*\?\s*implicitHeight\s*:\s*root\.taskListHeight/,
);
assert.match(
  normalTaskItemQml,
  /width:\s*root\.vertical\s*\?\s*root\.taskListWidth\s*:\s*root\.taskSlotWidth/,
);
assert.match(
  taskListRepresentationQml,
  /visibleItemCount:\s*root\.visibleTaskItems\.length/,
);
assert.match(
  mainQml,
  /VisibleTaskItemsLogic\.composeVisibleTaskItems\(normalTaskEntries,\s*remoteAttentionSource\.snapshot\)/,
);
assert.doesNotMatch(mainQml, /count:\s*remoteAttentionSource\.count/);
assert.doesNotMatch(mainQml, /target:\s*remoteAttentionSource\.target/);
assert.doesNotMatch(
  mainQml,
  /readonly property var remoteAttentionVisibleItem:/,
);
assert.match(mainQml, /visibleTaskItems:\s*root\.visibleTaskItems/);
assert.match(taskListRepresentationQml, /\bRemoteAttentionItem\s*\{/);
assert.match(
  taskListRepresentationQml,
  /source:\s*root\.remoteAttentionSource/,
);
assert.match(taskListRepresentationQml, /vertical:\s*root\.vertical/);
assert.match(taskListRepresentationQml, /taskSlotWidth:\s*root\.taskSlotWidth/);
assert.doesNotMatch(mainQml, /count:\s*remoteAttentionSource\.itemCount/);
assert.doesNotMatch(
  mainQml,
  /iconSource:\s*remoteAttentionSource\.itemIconSource/,
);
assert.doesNotMatch(
  mainQml,
  /modelIndex:\s*remoteAttentionSource\.itemModelIndex/,
);
assert.doesNotMatch(mainQml, /taskData:\s*remoteAttentionSource\.itemTaskData/);
assert.doesNotMatch(mainQml, /title:\s*remoteAttentionSource\.itemTitle/);
assert.doesNotMatch(mainQml, /visible:\s*remoteAttentionSource\.itemVisible/);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestVisibleActivation\(\)/,
);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestVisibleContextMenu\(request\)/,
);
assert.doesNotMatch(
  mainQml,
  /readonly property var visibleItem:\s*root\.remoteAttentionVisibleItem/,
);
assert.doesNotMatch(
  mainQml,
  /taskActivation\.activateRemoteAttention\(root\.remoteAttentionVisibleItem\)/,
);
assert.match(
  mainQml,
  /readonly property var normalVisibleTaskItems:\s*VisibleTaskItemsLogic\.normalVisibleTaskItems\(root\.visibleTaskItems\)/,
);
assert.match(
  taskListRepresentationQml,
  /model:\s*root\.normalVisibleTaskItems/,
);
assert.doesNotMatch(mainQml, /model:\s*root\.normalTaskEntries/);
assert.match(taskListRepresentationQml, /delegate:\s*NormalTaskItem\s*\{/);
assert.match(taskListRepresentationQml, /visibleItem:\s*modelData/);
assert.match(
  taskListRepresentationQml,
  /activationAdapter:\s*root\.activationAdapter/,
);
assert.match(
  taskListRepresentationQml,
  /contextMenuAdapter:\s*root\.contextMenuAdapter/,
);
assert.match(taskListRepresentationQml, /moveAdapter:\s*root\.moveAdapter/);
assert.doesNotMatch(mainQml, /delegate:\s*TaskItem\s*\{/);
assert.doesNotMatch(
  mainQml,
  /VisibleTaskItemsLogic\.visibleItemForNormalIndex/,
);
assert.doesNotMatch(mainQml, /root\.remoteAttentionState\.target\s*\?/);
assert.match(
  normalTaskItemQml,
  /slotWidth:\s*root\.vertical\s*\?\s*0\s*:\s*root\.taskSlotWidth/,
);
assert.doesNotMatch(mainQml, /taskActivation\.activateTaskEntry\(entry\)/);
assert.doesNotMatch(
  mainQml,
  /taskMover\.canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove/,
);
assert.doesNotMatch(mainQml, /taskMover\.moveTask\(sourceIndex, targetIndex\)/);
assert.match(mainQml, /\bTaskMoveAdapter\s*\{/);
assert.match(mainQml, /normalEntries:\s*root\.normalTaskEntries/);
assert.match(
  mainQml,
  /onActionResult:\s*result => \{[\s\S]*?actionLogger\.logActionResult\(result\);[\s\S]*?\}/,
);
assert.match(
  normalTaskItemQml,
  /canDropTask:\s*\(sourceIndex, targetIndex\) => root\.moveAdapter\.canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove/,
);
assert.match(
  normalTaskItemQml,
  /if \(root\.moveAdapter\.moveTask\(sourceIndex, targetIndex\)\) \{[\s\S]*?drop\.acceptProposedAction\(\);/,
);
assert.doesNotMatch(
  mainQml,
  /function canMoveTaskResult\(sourceIndex, targetIndex\)/,
);
assert.doesNotMatch(mainQml, /function moveTask\(sourceIndex, targetIndex\)/);
assert.doesNotMatch(mainQml, /TaskModelLogic\.canMoveTaskResult/);
assert.doesNotMatch(
  mainQml,
  /canDropTask:\s*\(sourceIndex, targetIndex\) => root\.canMoveTask\(sourceIndex, targetIndex\)/,
);
assert.match(taskListRepresentationQml, /columnSpacing:\s*0/);
assert.match(taskListRepresentationQml, /rowSpacing:\s*0/);
assert.match(taskListRepresentationQml, /^\s*spacing:\s*0$/m);

const taskItemQml = readFileSync(
  new URL("../package/contents/ui/TaskItem.qml", import.meta.url),
  "utf8",
);
assert.match(
  taskItemQml,
  /import "TaskInteractionLogic\.js" as TaskInteractionLogic/,
);
assert.match(taskItemQml, /\bTaskFrame\s*\{/);
assert.match(taskItemQml, /property bool pinnedLauncherOnly:\s*false/);
assert.match(taskItemQml, /mutedLauncher:\s*root\.pinnedLauncherOnly/);
assert.match(taskItemQml, /readonly property bool visualHighlighted:/);
assert.match(taskItemQml, /readonly property bool titleVisible:/);
assert.match(taskItemQml, /\bTaskLikeIcon\s*\{/);
assert.doesNotMatch(taskItemQml, /KirigamiPrimitives\.Icon\s*\{/);
assert.doesNotMatch(taskItemQml, /TaskVisualLogic\.iconActive\(\{/);
assert.match(
  taskItemQml,
  /QtQuick\.Drag\.mimeData:\s*TaskInteractionLogic\.taskDragMimeData\(root\.dragMimeType, root\.taskIndex\)/,
);
assert.match(
  taskItemQml,
  /TaskInteractionLogic\.taskDropSourceIndex\(drop\.getDataAsString\(root\.dragMimeType\)\)/,
);
assert.match(
  taskItemQml,
  /TaskInteractionLogic\.canAcceptTaskDrop\(sourceIndex, root\.taskIndex, root\.canDropTask\)/,
);
assert.match(taskItemQml, /\bTaskLikeInteraction\s*\{/);
assert.match(
  taskItemQml,
  /readonly property bool visualHighlighted:\s*taskLikeInteraction\.highlighted/,
);
assert.doesNotMatch(
  taskItemQml,
  /root\.contextMenuRequested\(TaskInteractionLogic\.taskContextMenuRequest/,
);
assert.doesNotMatch(
  taskItemQml,
  /QtQuick\.Timer\s*\{[\s\S]*?id:\s*contextMenuTimer/,
);
assert.doesNotMatch(taskItemQml, /QtQuick\.Keys\.onMenuPressed/);
assert.doesNotMatch(taskItemQml, /QtQuick\.HoverHandler\s*\{/);
assert.doesNotMatch(
  taskItemQml,
  /QtQuick\.TapHandler\s*\{[\s\S]*?acceptedButtons:\s*QtQuick\.Qt\.RightButton/,
);
assert.match(
  taskItemQml,
  /onActivated:\s*\{[\s\S]*?root\.activated\(root\.taskIndex\);[\s\S]*?\}/,
);
assert.doesNotMatch(taskItemQml, /function sourceIndexFromDrop/);
assert.doesNotMatch(taskItemQml, /function acceptsDrop/);
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
assert.doesNotMatch(
  attentionItemQml,
  /import "TaskInteractionLogic\.js" as TaskInteractionLogic/,
);
assert.match(attentionItemQml, /\bTaskFrame\s*\{/);
assert.match(
  attentionItemQml,
  /readonly property bool visualHighlighted:\s*taskLikeInteraction\.highlighted/,
);
assert.match(attentionItemQml, /readonly property bool titleVisible:/);
assert.match(attentionItemQml, /\bTaskLikeIcon\s*\{/);
assert.doesNotMatch(attentionItemQml, /KirigamiPrimitives\.Icon\s*\{/);
assert.doesNotMatch(attentionItemQml, /TaskVisualLogic\.iconActive\(\{/);
assert.match(attentionItemQml, /\bTaskLikeInteraction\s*\{/);
assert.doesNotMatch(
  attentionItemQml,
  /root\.contextMenuRequested\(TaskInteractionLogic\.taskContextMenuRequest/,
);
assert.doesNotMatch(
  attentionItemQml,
  /QtQuick\.Timer\s*\{[\s\S]*?id:\s*contextMenuTimer/,
);
assert.doesNotMatch(attentionItemQml, /QtQuick\.Keys\.onMenuPressed/);
assert.doesNotMatch(attentionItemQml, /QtQuick\.HoverHandler\s*\{/);
assert.doesNotMatch(
  attentionItemQml,
  /QtQuick\.TapHandler\s*\{[\s\S]*?acceptedButtons:\s*QtQuick\.Qt\.RightButton/,
);
assert.match(
  attentionItemQml,
  /onActivated:\s*\{[\s\S]*?root\.activated\(\);[\s\S]*?\}/,
);
assert.match(
  attentionItemQml,
  /QtQuickLayouts\.Layout\.fillWidth:\s*!root\.titleVisible/,
);
assert.doesNotMatch(attentionItemQml, /QtQuick\.Rectangle\s*\{/);

const taskLikeInteractionQml = readFileSync(
  new URL("../package/contents/ui/TaskLikeInteraction.qml", import.meta.url),
  "utf8",
);
assert.match(
  taskLikeInteractionQml,
  /import "TaskInteractionLogic\.js" as TaskInteractionLogic/,
);
assert.match(
  taskLikeInteractionQml,
  /readonly property bool highlighted:\s*pointerHandler\.hovered \|\| root\.focusTarget\.activeFocus \|\| root\.contextMenuOpen/,
);
assert.match(taskLikeInteractionQml, /signal activated/);
assert.match(
  taskLikeInteractionQml,
  /signal contextMenuRequested\(var request\)/,
);
assert.match(
  taskLikeInteractionQml,
  /QtQuick\.Keys\.onMenuPressed:\s*contextMenuTimer\.start\(\)/,
);
assert.match(taskLikeInteractionQml, /QtQuick\.HoverHandler\s*\{/);
assert.match(
  taskLikeInteractionQml,
  /QtQuick\.TapHandler\s*\{[\s\S]*?acceptedButtons:\s*QtQuick\.Qt\.RightButton[\s\S]*?contextMenuTimer\.start\(\);[\s\S]*?\}/,
);
assert.match(
  taskLikeInteractionQml,
  /QtQuick\.TapHandler\s*\{[\s\S]*?acceptedButtons:\s*QtQuick\.Qt\.LeftButton[\s\S]*?root\.activated\(\);[\s\S]*?\}/,
);
assert.match(
  taskLikeInteractionQml,
  /QtQuick\.Timer\s*\{[\s\S]*?id:\s*contextMenuTimer[\s\S]*?interval:\s*0[\s\S]*?root\.focusTarget\.forceActiveFocus\(QtQuick\.Qt\.MouseFocusReason\);[\s\S]*?root\.contextMenuRequested\(TaskInteractionLogic\.taskContextMenuRequest\(root\.modelIndex, root\.taskData, root\.visualParent\)\);[\s\S]*?\}/,
);
