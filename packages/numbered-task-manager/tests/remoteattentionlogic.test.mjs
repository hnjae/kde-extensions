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
    "createRemoteAttentionState",
    "createRemoteAttentionEntry",
    "publishRemoteAttention",
    "publishRemoteAttentionState",
    "qualifiesRemoteAttention",
    "remoteAttentionKey",
    "remoteAttentionSnapshot",
    "removeRemoteAttention",
    "removeRemoteAttentionState",
    "recomputeRemoteAttentionState",
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

assert.deepEqual(plain(logic.createRemoteAttentionState()), {
  count: 0,
  entries: [],
  entryMap: {},
  order: [],
  target: null,
});

let attentionState = logic.createRemoteAttentionState();
let stateResult = logic.publishRemoteAttentionState(
  attentionState,
  "",
  "state-a",
  true,
  { title: "State A" },
  false,
);
assert.equal(stateResult.publishedKey, "state-a");
assert.deepEqual(plain(attentionState), {
  count: 0,
  entries: [],
  entryMap: {},
  order: [],
  target: null,
});
attentionState = stateResult.state;
assert.deepEqual(plain(attentionState.order), ["state-a"]);
assert.equal(attentionState.count, 1);
assert.equal(attentionState.target.title, "State A");

stateResult = logic.publishRemoteAttentionState(
  attentionState,
  "",
  "state-b",
  true,
  { title: "State B" },
  false,
);
attentionState = stateResult.state;
assert.deepEqual(plain(attentionState.order), ["state-a", "state-b"]);
assert.deepEqual(plain(attentionState.entries.map((entry) => entry.title)), [
  "State A",
  "State B",
]);
assert.equal(attentionState.target.title, "State B");

stateResult = logic.publishRemoteAttentionState(
  attentionState,
  "state-a",
  "state-a",
  true,
  { title: "State A later" },
  true,
);
attentionState = stateResult.state;
assert.deepEqual(plain(attentionState.order), ["state-b", "state-a"]);
assert.equal(attentionState.target.title, "State A later");

stateResult = logic.publishRemoteAttentionState(
  attentionState,
  "state-b",
  "state-c",
  true,
  { title: "State C replaced" },
  false,
);
attentionState = stateResult.state;
assert.deepEqual(plain(attentionState.order), ["state-c", "state-a"]);
assert.equal(attentionState.target.title, "State A later");

const recomputedState = logic.recomputeRemoteAttentionState({
  entryMap: attentionState.entryMap,
  order: ["missing", "state-c"],
});
assert.equal(recomputedState.count, 1);
assert.equal(recomputedState.target.title, "State C replaced");
assert.deepEqual(plain(recomputedState.entries.map((entry) => entry.title)), [
  "State C replaced",
]);

attentionState = logic.removeRemoteAttentionState(
  attentionState,
  "state-a",
).state;
assert.deepEqual(plain(attentionState.order), ["state-c"]);
assert.equal(attentionState.count, 1);
assert.equal(attentionState.target.title, "State C replaced");

const missingStateRemoval = logic.removeRemoteAttentionState(
  attentionState,
  "not-present",
);
assert.equal(missingStateRemoval.state, attentionState);

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
