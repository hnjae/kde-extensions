// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const taskEntryLogic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskEntryLogic.js", import.meta.url),
  ["createBaseTaskEntry", "isRemoteVirtualDesktop"],
);
const logic = loadQmlJsModule(
  new URL("../package/contents/ui/RemoteAttentionLogic.js", import.meta.url),
  [
    "createRemoteAttentionEntry",
    "publishRemoteAttention",
    "qualifiesRemoteAttention",
    "remoteAttentionKey",
    "remoteAttentionSnapshot",
    "removeRemoteAttention",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const createRemoteAttentionEntry = (roles) =>
  logic.createRemoteAttentionEntry(roles, taskEntryLogic);
const qualifiesRemoteAttention = (task, isInCurrentActivity, currentDesktop) =>
  logic.qualifiesRemoteAttention(
    task,
    isInCurrentActivity,
    currentDesktop,
    taskEntryLogic,
  );

const modelIndex = { valid: true };
const remoteTask = createRemoteAttentionEntry({
  activities: ["work"],
  appName: "Remote App",
  demandingAttention: true,
  iconSource: "",
  index: 3,
  isOnAllVirtualDesktops: false,
  isWindow: true,
  launcherUrl: "remote.desktop",
  modelIndex,
  virtualDesktops: ["desktop-b"],
  winIds: [42],
});
assert.deepEqual(plain(remoteTask.activities), ["work"]);
assert.equal(remoteTask.demandingAttention, true);
assert.equal(remoteTask.iconSource, "dialog-warning");
assert.equal(remoteTask.index, 3);
assert.equal(remoteTask.isWindow, true);
assert.equal(remoteTask.launcherUrl, "remote.desktop");
assert.equal(remoteTask.modelIndex, modelIndex);
assert.equal(remoteTask.title, "Remote App");
assert.deepEqual(plain(remoteTask.virtualDesktops), ["desktop-b"]);
assert.deepEqual(plain(remoteTask.winIds), [42]);
assert.equal(
  qualifiesRemoteAttention(
    remoteTask,
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  true,
);
assert.equal(
  qualifiesRemoteAttention(
    { ...remoteTask, demandingAttention: false },
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  false,
);
assert.equal(
  qualifiesRemoteAttention(
    { ...remoteTask, virtualDesktops: ["desktop-a"] },
    (activities) => activities.includes("work"),
    "desktop-a",
  ),
  false,
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

attentionResult = logic.publishRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "window:2",
  "window:2",
  true,
  { title: "B updated" },
  false,
);
attentionEntryMap = attentionResult.entryMap;
attentionOrder = attentionResult.order;
assert.deepEqual(plain(attentionOrder), ["window:2", "a"]);
assert.equal(attentionResult.snapshot.entries[0].title, "B updated");
assert.equal(attentionResult.snapshot.target.title, "A later");

const snapshot = logic.remoteAttentionSnapshot(attentionEntryMap, [
  "missing",
  "window:2",
]);
assert.equal(snapshot.count, 1);
assert.equal(snapshot.target.title, "B updated");

const removed = logic.removeRemoteAttention(
  attentionEntryMap,
  attentionOrder,
  "a",
);
assert.deepEqual(plain(removed.order), ["window:2"]);
assert.equal(removed.snapshot.count, 1);
assert.equal(removed.snapshot.target.title, "B updated");

const unqualified = logic.publishRemoteAttention(
  removed.entryMap,
  removed.order,
  "window:2",
  "row:gone",
  false,
  { title: "B no longer qualifies" },
  false,
);
assert.deepEqual(plain(unqualified.order), []);
assert.equal(unqualified.publishedKey, "");
assert.equal(unqualified.snapshot.target, null);
