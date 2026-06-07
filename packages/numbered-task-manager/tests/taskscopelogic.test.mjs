// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskScopeLogic.js", import.meta.url),
  ["normalTaskModelFilterSettings", "remoteAttentionModelFilterSettings"],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(logic.normalTaskModelFilterSettings()), {
  filterByActivity: true,
  filterByScreen: false,
  filterByVirtualDesktop: true,
});
assert.deepEqual(plain(logic.remoteAttentionModelFilterSettings()), {
  filterByActivity: false,
  filterByScreen: false,
  filterByVirtualDesktop: false,
});

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const remoteAttentionSourceQml = readFileSync(
  new URL("../package/contents/ui/RemoteAttentionSource.qml", import.meta.url),
  "utf8",
);

assert.match(mainQml, /import "TaskScopeLogic\.js" as TaskScopeLogic/);
assert.match(
  mainQml,
  /filterByActivity:\s*TaskScopeLogic\.normalTaskModelFilterSettings\(\)\.filterByActivity/,
);
assert.match(
  mainQml,
  /filterByScreen:\s*TaskScopeLogic\.normalTaskModelFilterSettings\(\)\.filterByScreen/,
);
assert.match(
  mainQml,
  /filterByVirtualDesktop:\s*TaskScopeLogic\.normalTaskModelFilterSettings\(\)\.filterByVirtualDesktop/,
);
assert.match(
  remoteAttentionSourceQml,
  /import "TaskScopeLogic\.js" as TaskScopeLogic/,
);
assert.match(
  remoteAttentionSourceQml,
  /filterByActivity:\s*TaskScopeLogic\.remoteAttentionModelFilterSettings\(\)\.filterByActivity/,
);
assert.match(
  remoteAttentionSourceQml,
  /filterByScreen:\s*TaskScopeLogic\.remoteAttentionModelFilterSettings\(\)\.filterByScreen/,
);
assert.match(
  remoteAttentionSourceQml,
  /filterByVirtualDesktop:\s*TaskScopeLogic\.remoteAttentionModelFilterSettings\(\)\.filterByVirtualDesktop/,
);
