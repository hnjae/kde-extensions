// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const taskEntryLogic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskEntryLogic.js", import.meta.url),
  [
    "boolValue",
    "createBaseTaskEntry",
    "isOnCurrentVirtualDesktop",
    "normalTaskIconFallback",
    "numberValue",
    "stringValue",
  ],
);
const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskModelLogic.js", import.meta.url),
  [
    "canMoveTask",
    "composeNormalTaskEntries",
    "createNormalTaskEntry",
    "moveManualTaskOrder",
    "normalTaskEntryForSourceIndex",
    "qualifiesNormalTask",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const createNormalTaskEntry = (roles) => logic.createNormalTaskEntry(roles);
const qualifiesNormalTask = (task, isInCurrentActivity, currentDesktop) =>
  logic.qualifiesNormalTask(task, isInCurrentActivity, currentDesktop);

assert.equal(logic.createNormalTaskEntry.length, 1);
assert.equal(logic.qualifiesNormalTask.length, 3);

const modelIndex = { valid: true };
const normalTask = createNormalTaskEntry({
  activities: ["work"],
  active: 1,
  appName: "Fallback App",
  canLaunchNewInstance: false,
  hasLauncher: false,
  iconSource: "app-icon",
  index: 7,
  isLauncher: true,
  isMinimized: true,
  launcherPinned: true,
  launcherPosition: 2,
  launcherUrl: "app.desktop",
  modelIndex,
  virtualDesktops: ["desktop-a"],
});
assert.deepEqual(plain(normalTask.activities), ["work"]);
assert.equal(normalTask.active, true);
assert.equal(normalTask.canLaunchNewInstance, true);
assert.equal(normalTask.hasAnyLauncher, true);
assert.equal(normalTask.hasLauncher, true);
assert.equal(normalTask.iconSource, "app-icon");
assert.equal(normalTask.index, 7);
assert.equal(normalTask.isLauncher, true);
assert.equal(normalTask.isMinimized, true);
assert.equal(normalTask.launcherBacked, false);
assert.equal(normalTask.launcherPosition, 2);
assert.equal(normalTask.launcherUrl, "app.desktop");
assert.equal(normalTask.modelIndex, modelIndex);
assert.equal(normalTask.moveIndex, 7);
assert.equal(normalTask.sourceIndex, 7);
assert.equal(normalTask.title, "Fallback App");
assert.deepEqual(plain(normalTask.virtualDesktops), ["desktop-a"]);

assert.equal(
  qualifiesNormalTask(
    normalTask,
    (activities) => activities.includes("work"),
    "desktop-b",
  ),
  true,
);
assert.equal(
  qualifiesNormalTask(
    { ...normalTask, isLauncher: false, isWindow: true },
    (activities) => activities.includes("work"),
    "desktop-b",
  ),
  false,
);
assert.equal(
  qualifiesNormalTask(
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
  qualifiesNormalTask(
    { ...normalTask, isLauncher: false, isStartup: true },
    () => false,
    "desktop-a",
  ),
  false,
);

const normalEntryMap = {
  hiddenLauncher: {
    entryKey: "hiddenLauncher",
    isLauncher: true,
    launcherPosition: -1,
    launcherUrl: "hidden.desktop",
    sourceIndex: 1,
    title: "Hidden",
  },
  launcherB: {
    entryKey: "launcherB",
    isLauncher: true,
    launcherPosition: 1,
    launcherUrl: "appB.desktop",
    sourceIndex: 20,
    title: "B Launcher",
  },
  launcherA: {
    entryKey: "launcherA",
    isLauncher: true,
    launcherPosition: 0,
    launcherUrl: "appA.desktop",
    sourceIndex: 10,
    title: "A Launcher",
  },
  windowA1: {
    entryKey: "windowA1",
    isLauncher: false,
    launcherPosition: 0,
    launcherUrl: "appA.desktop",
    sourceIndex: 4,
    title: "A Window",
  },
  windowA2: {
    entryKey: "windowA2",
    isLauncher: false,
    launcherPosition: 0,
    launcherUrl: "appA.desktop",
    sourceIndex: 6,
    title: "A Extra",
  },
  windowC: {
    entryKey: "windowC",
    isLauncher: false,
    launcherPosition: -1,
    launcherUrl: "appC.desktop",
    sourceIndex: 8,
    title: "C Window",
  },
};

const composed = logic.composeNormalTaskEntries(
  normalEntryMap,
  ["windowC", "stale", "windowA2"],
  () => -1,
);

assert.deepEqual(plain(composed.entries.map((entry) => entry.entryKey)), [
  "windowA1",
  "launcherB",
  "windowC",
  "windowA2",
]);
assert.deepEqual(plain(composed.manualOrder), ["windowC", "windowA2"]);
assert.equal(composed.entries[0].launcherBacked, true);
assert.equal(composed.entries[0].pinnedLauncherUrl, "appA.desktop");
assert.equal(composed.entries[0].moveIndex, 10);
assert.equal(composed.entries[0].sourceIndex, 4);
assert.equal(composed.entries[1].launcherBacked, true);
assert.equal(composed.entries[1].pinnedLauncherUrl, "appB.desktop");
assert.equal(composed.entries[2].launcherBacked, false);

const sourceOrdered = logic.composeNormalTaskEntries(
  normalEntryMap,
  [],
  () => -1,
);
assert.deepEqual(plain(sourceOrdered.entries.map((entry) => entry.entryKey)), [
  "windowA1",
  "launcherB",
  "windowA2",
  "windowC",
]);
assert.deepEqual(plain(sourceOrdered.manualOrder), ["windowA2", "windowC"]);

const callbackPositionEntries = logic.composeNormalTaskEntries(
  {
    launcher: {
      entryKey: "launcher",
      isLauncher: true,
      launcherUrl: "callback.desktop",
      sourceIndex: 2,
    },
    window: {
      entryKey: "window",
      isLauncher: false,
      launcherUrl: "callback.desktop",
      sourceIndex: 1,
    },
  },
  [],
  (launcherUrl) => (launcherUrl === "callback.desktop" ? 0 : -1),
);
assert.deepEqual(
  plain(callbackPositionEntries.entries.map((entry) => entry.entryKey)),
  ["window"],
);
assert.equal(callbackPositionEntries.entries[0].moveIndex, 2);

assert.equal(
  logic.normalTaskEntryForSourceIndex(composed.entries, 10).entryKey,
  "windowA1",
);
assert.equal(logic.normalTaskEntryForSourceIndex(composed.entries, 999), null);
assert.equal(
  logic.canMoveTask(composed.entries, 10, 20, () => true),
  true,
);
assert.equal(
  logic.canMoveTask(composed.entries, 10, 8, () => true),
  false,
);
assert.equal(
  logic.canMoveTask(composed.entries, 8, 6, () => false),
  true,
);
assert.equal(
  logic.canMoveTask(composed.entries, 10, 20, () => false),
  false,
);
assert.equal(
  logic.canMoveTask(composed.entries, 10, 10, () => true),
  false,
);

assert.deepEqual(
  plain(logic.moveManualTaskOrder(composed.entries, "windowC", "windowA2")),
  {
    moved: true,
    order: ["windowA2", "windowC"],
  },
);
assert.deepEqual(
  plain(logic.moveManualTaskOrder(composed.entries, "windowC", "nope")),
  {
    moved: false,
    order: ["windowC", "windowA2"],
  },
);
