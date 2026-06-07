// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskActivationAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskActivationAdapter\s*\{/);
assert.match(mainQml, /id:\s*taskActivation/);
assert.match(mainQml, /taskModel:\s*tasksModel/);
assert.match(mainQml, /remoteAttentionSource:\s*remoteAttentionSource/);
assert.match(mainQml, /taskActivation\.requestActivation\(result\)/);
assert.doesNotMatch(mainQml, /function requestActivation\(/);
assert.doesNotMatch(
  mainQml,
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\)/,
);
assert.doesNotMatch(
  mainQml,
  /tasksModel\.requestActivate\(result\.modelIndex\)/,
);

assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /property var taskModel/);
assert.match(sourceQml, /property var remoteAttentionSource/);
assert.match(sourceQml, /function requestActivation\(result\)/);
assert.match(sourceQml, /result\.sourceModel === "remoteAttention"/);
assert.match(
  sourceQml,
  /remoteAttentionSource\.requestActivate\(result\.modelIndex\)/,
);
assert.match(sourceQml, /taskModel\.requestActivate\(result\.modelIndex\)/);
