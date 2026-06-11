// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskListRepresentation.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /fullRepresentation:\s*TaskListRepresentation\s*\{/);
assert.match(mainQml, /activationAdapter:\s*taskActivation/);
assert.match(mainQml, /contextMenuAdapter:\s*contextMenuAdapter/);
assert.match(mainQml, /moveAdapter:\s*taskMover/);
assert.match(mainQml, /remoteAttentionSource:\s*remoteAttentionSource/);
assert.match(mainQml, /normalVisibleTaskItems:\s*root\.normalVisibleTaskItems/);
assert.match(mainQml, /visibleTaskItems:\s*root\.visibleTaskItems/);
assert.match(mainQml, /taskDragMimeType:\s*root\.taskDragMimeType/);
assert.match(mainQml, /vertical:\s*root\.vertical/);
assert.doesNotMatch(mainQml, /fullRepresentation:\s*QtQuick\.Item\s*\{/);
assert.doesNotMatch(mainQml, /\bQtQuick\.ListView\s*\{/);
assert.doesNotMatch(mainQml, /\bRemoteAttentionItem\s*\{/);
assert.doesNotMatch(mainQml, /delegate:\s*NormalTaskItem\s*\{/);
assert.doesNotMatch(mainQml, /attentionLongExtent:/);
assert.doesNotMatch(mainQml, /taskSlotWidth:\s*root\.vertical \? taskExtent/);

assert.match(sourceQml, /import QtQuick as QtQuick/);
assert.match(sourceQml, /import QtQuick\.Layouts as QtQuickLayouts/);
assert.match(sourceQml, /import org\.kde\.kirigami as Kirigami/);
assert.match(sourceQml, /import "TaskMetricsLogic\.mjs" as TaskMetricsLogic/);
assert.match(sourceQml, /^QtQuick\.Item\s*\{/m);
assert.match(sourceQml, /required property var activationAdapter/);
assert.match(sourceQml, /required property var contextMenuAdapter/);
assert.match(sourceQml, /required property var moveAdapter/);
assert.match(sourceQml, /required property var remoteAttentionSource/);
assert.match(sourceQml, /property var normalVisibleTaskItems:\s*\[\]/);
assert.match(sourceQml, /property var visibleTaskItems:\s*\[\]/);
assert.match(sourceQml, /property string taskDragMimeType:\s*""/);
assert.match(sourceQml, /property bool vertical:\s*false/);
assert.match(
  sourceQml,
  /readonly property int visibleItemCount:\s*root\.visibleTaskItems\.length/,
);
assert.match(sourceQml, /model:\s*root\.normalVisibleTaskItems/);
assert.match(sourceQml, /delegate:\s*NormalTaskItem\s*\{/);
assert.match(sourceQml, /activationAdapter:\s*root\.activationAdapter/);
assert.match(sourceQml, /contextMenuAdapter:\s*root\.contextMenuAdapter/);
assert.match(sourceQml, /moveAdapter:\s*root\.moveAdapter/);
assert.match(sourceQml, /taskDragMimeType:\s*root\.taskDragMimeType/);
assert.match(sourceQml, /visibleItem:\s*modelData/);
assert.match(sourceQml, /\bRemoteAttentionItem\s*\{/);
assert.match(sourceQml, /source:\s*root\.remoteAttentionSource/);
assert.match(sourceQml, /vertical:\s*root\.vertical/);
