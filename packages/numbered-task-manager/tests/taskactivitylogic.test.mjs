// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

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
