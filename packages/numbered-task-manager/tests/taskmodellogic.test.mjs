// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskModelLogic.js", import.meta.url),
  [
    "canMoveTask",
    "composeNormalTaskEntries",
    "desktopId",
    "desktopListContains",
    "isOnCurrentVirtualDesktop",
    "isRemoteVirtualDesktop",
    "moveManualTaskOrder",
    "normalTaskEntryForSourceIndex",
    "publishRemoteAttention",
    "remoteAttentionKey",
    "remoteAttentionSnapshot",
    "removeRemoteAttention",
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

assert.equal(
  logic.remoteAttentionKey([123, 456], "app.desktop", "Title", 4),
  "window:123,456",
);
assert.equal(
  logic.remoteAttentionKey([], "app.desktop", "Title", 4),
  "row:4:app.desktop:Title",
);

let attentionEntryMap = {};
let attentionOrder = [];
let attentionResult = logic.publishRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "",
  "a",
  true,
  { title: "A" },
  false,
);
attentionEntryMap = attentionResult.entryMap;
attentionOrder = attentionResult.order;
assert.equal(attentionResult.publishedKey, "a");
assert.equal(attentionResult.snapshot.count, 1);
assert.equal(attentionResult.snapshot.target.title, "A");

attentionResult = logic.publishRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "",
  "b",
  true,
  { title: "B" },
  false,
);
attentionEntryMap = attentionResult.entryMap;
attentionOrder = attentionResult.order;
assert.deepEqual(plain(attentionOrder), ["a", "b"]);
assert.equal(attentionResult.snapshot.target.title, "B");

attentionResult = logic.publishRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "a",
  "a",
  true,
  { title: "A later" },
  true,
);
attentionEntryMap = attentionResult.entryMap;
attentionOrder = attentionResult.order;
assert.deepEqual(plain(attentionOrder), ["b", "a"]);
assert.equal(attentionResult.snapshot.target.title, "A later");

attentionResult = logic.publishRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "b",
  "window:2",
  true,
  { title: "B stable key" },
  false,
);
attentionEntryMap = attentionResult.entryMap;
attentionOrder = attentionResult.order;
assert.deepEqual(plain(attentionOrder), ["window:2", "a"]);
assert.equal(attentionResult.snapshot.target.title, "A later");

const snapshot = logic.remoteAttentionSnapshot(attentionEntryMap, [
  "missing",
  "window:2",
]);
assert.equal(snapshot.count, 1);
assert.equal(snapshot.target.title, "B stable key");

const removed = logic.removeRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "a",
);
assert.deepEqual(plain(removed.order), ["window:2"]);
assert.equal(removed.snapshot.count, 1);
assert.equal(removed.snapshot.target.title, "B stable key");

const unqualified = logic.publishRemoteAttention(
  removed.entryMap,
  removed.order,
  "window:2",
  "window:2",
  false,
  { title: "B stable key" },
  false,
);
assert.deepEqual(plain(unqualified.order), []);
assert.equal(unqualified.publishedKey, "");
assert.equal(unqualified.snapshot.target, null);
