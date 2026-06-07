// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskScopeLogic.js", import.meta.url),
  [
    "normalTaskModelFilterSettings",
    "normalTaskQualifies",
    "remoteAttentionModelFilterSettings",
    "remoteAttentionQualifies",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const normalTaskQualifies = (task, isInCurrentActivity, currentDesktop) =>
  logic.normalTaskQualifies(task, isInCurrentActivity, currentDesktop);
const remoteAttentionQualifies = (task, isInCurrentActivity, currentDesktop) =>
  logic.remoteAttentionQualifies(task, isInCurrentActivity, currentDesktop);

assert.equal(logic.normalTaskQualifies.length, 3);
assert.equal(logic.remoteAttentionQualifies.length, 3);

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

const normalTask = {
  activities: ["work"],
  isLauncher: true,
  isStartup: false,
  isWindow: false,
  virtualDesktops: ["desktop-a"],
};
assert.equal(
  normalTaskQualifies(
    normalTask,
    (activities) => activities.includes("work"),
    "desktop-b",
  ),
  true,
);
assert.equal(
  normalTaskQualifies(
    { ...normalTask, isLauncher: false, isWindow: true },
    (activities) => activities.includes("work"),
    "desktop-b",
  ),
  false,
);
assert.equal(
  normalTaskQualifies(
    {
      ...normalTask,
      isLauncher: false,
      isOnAllVirtualDesktops: false,
      isWindow: true,
    },
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  true,
);
assert.equal(
  normalTaskQualifies(
    { ...normalTask, isLauncher: false, isStartup: true },
    () => false,
    "desktop-a",
  ),
  false,
);

const remoteAttentionTask = {
  activities: ["work"],
  demandingAttention: true,
  isOnAllVirtualDesktops: false,
  isWindow: true,
  virtualDesktops: ["desktop-b"],
};
assert.equal(
  remoteAttentionQualifies(
    remoteAttentionTask,
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  true,
);
assert.equal(
  remoteAttentionQualifies(
    { ...remoteAttentionTask, demandingAttention: false },
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  false,
);
assert.equal(
  remoteAttentionQualifies(
    { ...remoteAttentionTask, virtualDesktops: ["desktop-a"] },
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  false,
);

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const normalTaskSourceQml = readFileSync(
  new URL("../package/contents/ui/NormalTaskSource.qml", import.meta.url),
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
  normalTaskSourceQml,
  /import "TaskScopeLogic\.js" as TaskScopeLogic/,
);
assert.match(
  normalTaskSourceQml,
  /property bool qualifies:\s*TaskScopeLogic\.normalTaskQualifies\(taskInfo, activities => root\.taskIsInCurrentActivity\(activities\), root\.currentDesktop\)/,
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
assert.match(
  remoteAttentionSourceQml,
  /property bool qualifies:\s*TaskScopeLogic\.remoteAttentionQualifies\(taskInfo, activities => root\.taskIsInCurrentActivity\(activities\), root\.currentDesktop\)/,
);
