// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourceUrl = new URL(
  "../package/contents/ui/TaskCommandPort.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskModel/);
assert.match(
  sourceQml,
  /function supportsContextMenuTaskRequest\(requestMethod\)/,
);

for (const requestMethod of [
  "requestNewInstance",
  "requestMove",
  "requestResize",
  "requestToggleMinimized",
  "requestToggleMaximized",
  "requestToggleKeepAbove",
  "requestToggleKeepBelow",
  "requestToggleFullScreen",
  "requestToggleShaded",
  "requestToggleNoBorder",
  "requestToggleExcludeFromCapture",
  "requestClose",
  "requestActivities",
  "requestVirtualDesktops",
  "requestNewVirtualDesktop",
]) {
  assert.match(
    sourceQml,
    new RegExp(`case "${requestMethod}"`),
    `${requestMethod} should be in the supported method map`,
  );
  assert.match(
    sourceQml,
    new RegExp(`function ${requestMethod}\\(`),
    `${requestMethod} should be exposed by the port`,
  );
}

assert.match(
  sourceQml,
  /return typeof taskModel\[requestMethod\] === "function";/,
);
assert.doesNotMatch(sourceQml, /taskModel\[result\.requestMethod\]/);
