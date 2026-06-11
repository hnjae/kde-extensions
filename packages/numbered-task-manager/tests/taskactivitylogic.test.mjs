// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskActivityLogic.mjs", import.meta.url),
  ["taskActivitiesAfterToggle"],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

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

const taskActivityLogic = readFileSync(
  new URL("../package/contents/ui/TaskActivityLogic.mjs", import.meta.url),
  "utf8",
);
const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const platformStateQml = readFileSync(
  new URL("../package/contents/ui/TaskPlatformState.qml", import.meta.url),
  "utf8",
);

assert.doesNotMatch(taskActivityLogic, /function allActivitiesId\b/);
assert.doesNotMatch(taskActivityLogic, /function stringListContains\b/);
assert.doesNotMatch(taskActivityLogic, /function uniqueStringList\b/);
assert.doesNotMatch(taskActivityLogic, /function activitiesAreAll\b/);
assert.doesNotMatch(taskActivityLogic, /function normalizedActivityList\b/);
assert.doesNotMatch(taskActivityLogic, /function isInCurrentActivity\b/);
assert.doesNotMatch(
  mainQml,
  /import "ActivityScopeLogic\.mjs" as ActivityScopeLogic/,
);
assert.match(
  platformStateQml,
  /import "ActivityScopeLogic\.mjs" as ActivityScopeLogic/,
);
assert.match(
  platformStateQml,
  /return ActivityScopeLogic\.isInCurrentActivity\(activities, root\.currentActivity\);/,
);
assert.doesNotMatch(
  mainQml,
  /TaskActivityLogic\.isInCurrentActivity\(activities, activityInfo\.currentActivity\)/,
);
