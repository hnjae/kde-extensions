// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskActivityLogic.js", import.meta.url),
  [
    "activitiesAreAll",
    "isInCurrentActivity",
    "normalizedActivityList",
    "stringListContains",
    "taskActivitiesAfterToggle",
    "uniqueStringList",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(logic.stringListContains(["1", "2"], 2), true);
assert.equal(logic.stringListContains(["1", "2"], 3), false);

assert.deepEqual(plain(logic.uniqueStringList(["work", "", "work", "chat"])), [
  "work",
  "chat",
]);
assert.equal(logic.activitiesAreAll([]), true);
assert.equal(logic.activitiesAreAll([nullActivityId]), true);
assert.equal(logic.activitiesAreAll(["work"]), false);
assert.deepEqual(plain(logic.normalizedActivityList([])), [nullActivityId]);
assert.deepEqual(
  plain(logic.normalizedActivityList(["work", "work", "chat"])),
  ["work", "chat"],
);

assert.equal(logic.isInCurrentActivity(["work"], ""), true);
assert.equal(logic.isInCurrentActivity([], "work"), true);
assert.equal(logic.isInCurrentActivity([nullActivityId], "work"), true);
assert.equal(logic.isInCurrentActivity(["work"], "work"), true);
assert.equal(logic.isInCurrentActivity(["chat"], "work"), false);

assert.deepEqual(plain(logic.taskActivitiesAfterToggle([], "work")), ["work"]);
assert.deepEqual(
  plain(logic.taskActivitiesAfterToggle([nullActivityId], "work")),
  ["work"],
);
assert.deepEqual(
  plain(logic.taskActivitiesAfterToggle(["work", "chat"], "work")),
  ["chat"],
);
assert.deepEqual(plain(logic.taskActivitiesAfterToggle(["work"], "chat")), [
  "work",
  "chat",
]);
