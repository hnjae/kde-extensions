// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const taskListRepresentationQml = readFileSync(
  new URL("../package/contents/ui/TaskListRepresentation.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/NormalTaskItem.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /fullRepresentation:\s*TaskListRepresentation\s*\{/);
assert.match(mainQml, /activationAdapter:\s*taskActivation/);
assert.match(mainQml, /contextMenuAdapter:\s*contextMenuAdapter/);
assert.match(mainQml, /moveAdapter:\s*taskMover/);
assert.match(mainQml, /normalVisibleTaskItems:\s*root\.normalVisibleTaskItems/);
assert.match(mainQml, /taskDragMimeType:\s*root\.taskDragMimeType/);
assert.match(mainQml, /vertical:\s*root\.vertical/);
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
assert.match(
  taskListRepresentationQml,
  /taskDragMimeType:\s*root\.taskDragMimeType/,
);
assert.match(taskListRepresentationQml, /taskListHeight:\s*taskList\.height/);
assert.match(taskListRepresentationQml, /taskListWidth:\s*taskList\.width/);
assert.match(taskListRepresentationQml, /taskSlotWidth:\s*root\.taskSlotWidth/);
assert.match(taskListRepresentationQml, /vertical:\s*root\.vertical/);
assert.doesNotMatch(mainQml, /delegate:\s*TaskItem\s*\{/);
assert.doesNotMatch(
  mainQml,
  /readonly property var entry:\s*visibleItem\.entry/,
);
assert.doesNotMatch(mainQml, /taskActivation\.activateTaskEntry\(entry\)/);
assert.doesNotMatch(
  mainQml,
  /taskMover\.canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove/,
);
assert.doesNotMatch(mainQml, /taskMover\.moveTask\(sourceIndex, targetIndex\)/);

assert.match(sourceQml, /^TaskItem\s*\{/m);
assert.match(sourceQml, /import "TaskEntryLogic\.js" as TaskEntryLogic/);
assert.match(sourceQml, /required property var activationAdapter/);
assert.match(sourceQml, /required property var contextMenuAdapter/);
assert.match(sourceQml, /required property var moveAdapter/);
assert.match(sourceQml, /required property var visibleItem/);
assert.match(sourceQml, /property bool vertical:\s*false/);
assert.match(sourceQml, /property real taskListHeight:\s*0/);
assert.match(sourceQml, /property real taskListWidth:\s*0/);
assert.match(sourceQml, /property real taskSlotWidth:\s*0/);
assert.match(sourceQml, /property string taskDragMimeType:\s*""/);
assert.match(sourceQml, /readonly property var entry:/);
assert.match(
  sourceQml,
  /height:\s*root\.vertical\s*\?\s*implicitHeight\s*:\s*root\.taskListHeight/,
);
assert.match(
  sourceQml,
  /width:\s*root\.vertical\s*\?\s*root\.taskListWidth\s*:\s*root\.taskSlotWidth/,
);
assert.match(
  sourceQml,
  /slotWidth:\s*root\.vertical\s*\?\s*0\s*:\s*root\.taskSlotWidth/,
);
assert.match(
  sourceQml,
  /taskIndex:\s*root\.entry\.moveIndex \?\? root\.entry\.sourceIndex \?\? -1/,
);
assert.match(sourceQml, /modelIndex:\s*root\.entry\.modelIndex/);
assert.match(sourceQml, /slotNumber:\s*root\.item\.slotNumber \|\| 0/);
assert.match(sourceQml, /title:\s*root\.entry\.title \|\| ""/);
assert.match(
  sourceQml,
  /showTitle:\s*!\(root\.entry\.launcherBacked && root\.entry\.isLauncher\)/,
);
assert.match(
  sourceQml,
  /iconSource:\s*root\.entry\.iconSource \|\| TaskEntryLogic\.normalTaskIconFallback\(\)/,
);
assert.match(sourceQml, /active:\s*root\.entry\.active \|\| false/);
assert.match(sourceQml, /minimized:\s*root\.entry\.isMinimized \|\| false/);
assert.match(
  sourceQml,
  /pinnedLauncherOnly:\s*root\.entry\.launcherBacked && root\.entry\.isLauncher/,
);
assert.match(sourceQml, /launcher:\s*root\.entry\.isLauncher \|\| false/);
assert.match(
  sourceQml,
  /demandingAttention:\s*root\.entry\.demandingAttention \|\| false/,
);
assert.match(sourceQml, /dragMimeType:\s*root\.taskDragMimeType/);
assert.match(
  sourceQml,
  /root\.moveAdapter\.canMoveTaskResult\(sourceIndex, targetIndex\)\.canMove/,
);
assert.match(
  sourceQml,
  /root\.activationAdapter\.activateTaskEntry\(root\.entry\)/,
);
assert.match(
  sourceQml,
  /root\.contextMenuAdapter\.openTaskContextMenu\(request\)/,
);
assert.match(
  sourceQml,
  /root\.moveAdapter\.moveTask\(sourceIndex, targetIndex\)/,
);
assert.match(sourceQml, /drop\.acceptProposedAction\(\)/);
assert.match(sourceQml, /taskData:\s*root\.entry/);
