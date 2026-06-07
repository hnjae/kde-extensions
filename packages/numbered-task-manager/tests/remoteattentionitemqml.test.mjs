// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/RemoteAttentionItem.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bRemoteAttentionItem\s*\{/);
assert.match(mainQml, /id:\s*attentionItem/);
assert.match(mainQml, /source:\s*remoteAttentionSource/);
assert.match(mainQml, /vertical:\s*root\.vertical/);
assert.match(mainQml, /taskSlotWidth:\s*fullRepresentationItem\.taskSlotWidth/);
assert.match(
  mainQml,
  /titleVisibilityThreshold:\s*fullRepresentationItem\.titleVisibilityThreshold/,
);
assert.doesNotMatch(
  mainQml,
  /\bAttentionItem\s*\{[\s\S]*?count:\s*remoteAttentionSource\.itemCount/,
);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestVisibleActivation\(\)/,
);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestVisibleContextMenu\(request\)/,
);

assert.match(sourceQml, /^AttentionItem\s*\{/m);
assert.match(sourceQml, /import QtQuick\.Layouts as QtQuickLayouts/);
assert.match(sourceQml, /property var source/);
assert.match(sourceQml, /property bool vertical:\s*false/);
assert.match(sourceQml, /property real taskSlotWidth:\s*0/);
assert.match(
  sourceQml,
  /QtQuickLayouts\.Layout\.fillHeight:\s*!root\.vertical/,
);
assert.match(sourceQml, /QtQuickLayouts\.Layout\.fillWidth:\s*root\.vertical/);
assert.match(
  sourceQml,
  /QtQuickLayouts\.Layout\.preferredWidth:\s*root\.vertical\s*\?\s*implicitWidth\s*:\s*root\.taskSlotWidth/,
);
assert.match(sourceQml, /count:\s*root\.source\.itemCount/);
assert.match(sourceQml, /iconSource:\s*root\.source\.itemIconSource/);
assert.match(sourceQml, /modelIndex:\s*root\.source\.itemModelIndex/);
assert.match(
  sourceQml,
  /slotWidth:\s*root\.vertical\s*\?\s*0\s*:\s*root\.taskSlotWidth/,
);
assert.match(sourceQml, /taskData:\s*root\.source\.itemTaskData/);
assert.match(sourceQml, /title:\s*root\.source\.itemTitle/);
assert.match(sourceQml, /visible:\s*root\.source\.itemVisible/);
assert.match(sourceQml, /root\.source\.requestVisibleActivation\(\)/);
assert.match(sourceQml, /root\.source\.requestVisibleContextMenu\(request\)/);
