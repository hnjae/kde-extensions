// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskEntryLogic.js", import.meta.url),
  [
    "boolValue",
    "createBaseTaskEntry",
    "desktopId",
    "desktopListContains",
    "hasValidModelIndex",
    "isOnCurrentVirtualDesktop",
    "isRemoteVirtualDesktop",
    "numberValue",
    "stringValue",
    "taskIconSource",
    "taskTitle",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(logic.desktopId(null), "");
assert.equal(logic.desktopId("desktop-a"), "desktop-a");
assert.equal(logic.desktopId({ id: "desktop-b" }), "desktop-b");
assert.equal(
  logic.desktopListContains(["desktop-a"], { id: "desktop-a" }),
  true,
);
assert.equal(logic.desktopListContains(["desktop-a"], "desktop-b"), false);

assert.equal(logic.isOnCurrentVirtualDesktop([], true, "desktop-a"), true);
assert.equal(
  logic.isOnCurrentVirtualDesktop(["desktop-a"], false, "desktop-a"),
  true,
);
assert.equal(
  logic.isOnCurrentVirtualDesktop(["desktop-b"], false, "desktop-a"),
  false,
);
assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-b"], false, "desktop-a"),
  true,
);
assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-a"], false, "desktop-a"),
  false,
);
assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-b"], true, "desktop-a"),
  false,
);

assert.equal(logic.hasValidModelIndex(null), false);
assert.equal(logic.hasValidModelIndex({ valid: false }), false);
assert.equal(logic.hasValidModelIndex({ valid: true }), true);
assert.equal(logic.hasValidModelIndex({}), true);

assert.equal(logic.boolValue(1), true);
assert.equal(logic.boolValue(0), false);
assert.equal(logic.stringValue(null), "");
assert.equal(logic.stringValue(42), "42");
assert.equal(logic.numberValue(undefined, -1), -1);
assert.equal(logic.numberValue("5", -1), 5);
assert.equal(logic.numberValue("not-a-number", -1), -1);
assert.equal(logic.taskTitle("", "Fallback App"), "Fallback App");
assert.equal(logic.taskIconSource("", "fallback-icon"), "fallback-icon");

const modelIndex = { valid: true };
const baseTask = logic.createBaseTaskEntry(
  {
    activities: ["work"],
    appName: "Fallback App",
    demandingAttention: 1,
    iconSource: "app-icon",
    index: 7,
    isOnAllVirtualDesktops: false,
    isWindow: true,
    launcherUrl: "app.desktop",
    modelIndex,
    virtualDesktops: ["desktop-a"],
  },
  "application-x-executable",
);

assert.deepEqual(plain(baseTask.activities), ["work"]);
assert.equal(baseTask.demandingAttention, true);
assert.equal(baseTask.iconSource, "app-icon");
assert.equal(baseTask.index, 7);
assert.equal(baseTask.isOnAllVirtualDesktops, false);
assert.equal(baseTask.isWindow, true);
assert.equal(baseTask.launcherUrl, "app.desktop");
assert.equal(baseTask.modelIndex, modelIndex);
assert.equal(baseTask.title, "Fallback App");
assert.deepEqual(plain(baseTask.virtualDesktops), ["desktop-a"]);
