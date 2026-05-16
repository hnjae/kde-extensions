// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = loadQmlJsModule(
  new URL("../package/contents/ui/TaskHelpers.js", import.meta.url),
  [
    "activitiesAreAll",
    "effectiveSerializedLauncherActivities",
    "isInCurrentActivity",
    "launcherActivitiesAfterAllToggle",
    "launcherActivitiesAfterToggle",
    "launcherListWithActivitiesAt",
    "launcherListsEqual",
    "normalizedActivityList",
    "normalizedLauncherList",
    "parseSerializedLauncher",
    "serializeLauncherWithActivities",
    "serializedLauncherVisibleInActivity",
    "stringListContains",
    "taskActivitiesAfterToggle",
    "uniqueStringList",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(helpers.stringListContains(["1", "2"], 2), true);
assert.equal(helpers.stringListContains(["1", "2"], 3), false);

assert.deepEqual(plain(helpers.normalizedLauncherList(null)), []);
assert.deepEqual(
  plain(helpers.normalizedLauncherList(["", "app.desktop", null])),
  ["app.desktop"],
);
assert.equal(helpers.launcherListsEqual(["a", "", "b"], ["a", "b"]), true);
assert.equal(helpers.launcherListsEqual(["a", "b"], ["b", "a"]), false);

assert.deepEqual(
  plain(helpers.uniqueStringList(["work", "", "work", "chat"])),
  ["work", "chat"],
);
assert.equal(helpers.activitiesAreAll([]), true);
assert.equal(helpers.activitiesAreAll([nullActivityId]), true);
assert.equal(helpers.activitiesAreAll(["work"]), false);
assert.deepEqual(plain(helpers.normalizedActivityList([])), [nullActivityId]);
assert.deepEqual(
  plain(helpers.normalizedActivityList(["work", "work", "chat"])),
  ["work", "chat"],
);

assert.deepEqual(
  plain(helpers.parseSerializedLauncher("org.example.App.desktop")),
  {
    activities: [],
    url: "org.example.App.desktop",
  },
);
assert.deepEqual(
  plain(
    helpers.parseSerializedLauncher("[work,chat]\norg.example.App.desktop"),
  ),
  {
    activities: ["work", "chat"],
    url: "org.example.App.desktop",
  },
);
assert.deepEqual(
  plain(helpers.parseSerializedLauncher("[work]org.example.App.desktop")),
  {
    activities: [],
    url: "[work]org.example.App.desktop",
  },
);

assert.deepEqual(
  plain(helpers.effectiveSerializedLauncherActivities("[work]\napp.desktop")),
  ["work"],
);
assert.deepEqual(
  plain(helpers.effectiveSerializedLauncherActivities("app.desktop")),
  [nullActivityId],
);

assert.equal(helpers.isInCurrentActivity(["work"], ""), true);
assert.equal(helpers.isInCurrentActivity([], "work"), true);
assert.equal(helpers.isInCurrentActivity([nullActivityId], "work"), true);
assert.equal(helpers.isInCurrentActivity(["work"], "work"), true);
assert.equal(helpers.isInCurrentActivity(["chat"], "work"), false);
assert.equal(
  helpers.serializedLauncherVisibleInActivity("[work]\napp.desktop", "work"),
  true,
);
assert.equal(
  helpers.serializedLauncherVisibleInActivity("[chat]\napp.desktop", "work"),
  false,
);

assert.deepEqual(plain(helpers.taskActivitiesAfterToggle([], "work")), [
  "work",
]);
assert.deepEqual(
  plain(helpers.taskActivitiesAfterToggle([nullActivityId], "work")),
  ["work"],
);
assert.deepEqual(
  plain(helpers.taskActivitiesAfterToggle(["work", "chat"], "work")),
  ["chat"],
);
assert.deepEqual(plain(helpers.taskActivitiesAfterToggle(["work"], "chat")), [
  "work",
  "chat",
]);

assert.equal(
  helpers.serializeLauncherWithActivities("[old]\napp.desktop", ["work"]),
  "[work]\napp.desktop",
);
assert.equal(
  helpers.serializeLauncherWithActivities("[old]\napp.desktop", [
    nullActivityId,
  ]),
  "app.desktop",
);
assert.deepEqual(
  plain(
    helpers.launcherListWithActivitiesAt(["one.desktop", "two.desktop"], 1, [
      "work",
    ]),
  ),
  ["one.desktop", "[work]\ntwo.desktop"],
);
assert.equal(
  helpers.launcherListWithActivitiesAt(["one.desktop"], 2, ["work"]),
  null,
);

assert.deepEqual(
  plain(helpers.launcherActivitiesAfterAllToggle([nullActivityId], "work")),
  ["work"],
);
assert.equal(
  helpers.launcherActivitiesAfterAllToggle([nullActivityId], ""),
  null,
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterAllToggle(["work"], "work")),
  [nullActivityId],
);
assert.deepEqual(
  plain(
    helpers.launcherActivitiesAfterToggle([nullActivityId], "chat", "work"),
  ),
  ["chat"],
);
assert.deepEqual(
  plain(
    helpers.launcherActivitiesAfterToggle(["work", "chat"], "work", "work"),
  ),
  ["chat"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "work", "chat")),
  ["chat"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "work", "")),
  ["work"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "chat", "work")),
  ["work", "chat"],
);
