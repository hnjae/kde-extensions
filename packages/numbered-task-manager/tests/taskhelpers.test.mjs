// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = loadQmlJsModule(
  new URL("../package/contents/ui/TaskHelpers.js", import.meta.url),
  [
    "activitiesAreAll",
    "canMovePinnedLauncher",
    "effectiveSerializedLauncherActivities",
    "isInCurrentActivity",
    "launcherActivitiesAfterAllToggle",
    "launcherActivitiesAfterToggle",
    "launcherListWithActivitiesAt",
    "launcherListsEqual",
    "movePinnedLauncher",
    "normalizedActivityList",
    "normalizedLauncherList",
    "parseSerializedLauncher",
    "pinnedLauncherGlobalPosition",
    "serializeLauncherWithActivities",
    "serializedLauncherVisibleInActivity",
    "stringListContains",
    "taskActivitiesAfterToggle",
    "uniqueStringList",
    "visibleLauncherPosition",
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

const visibleLaunchers = [
  "[work]\napp-a.desktop",
  "[chat]\napp-b.desktop",
  "app-c.desktop",
];
const launcherPosition = (launcherUrl) =>
  ({
    "app-a.desktop": 0,
    "app-b.desktop": 1,
    "app-c.desktop": 2,
  })[launcherUrl] ?? -1;

assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-a.desktop",
    "work",
    launcherPosition,
  ),
  0,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-b.desktop",
    "work",
    launcherPosition,
  ),
  -1,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-c.desktop",
    "work",
    launcherPosition,
  ),
  1,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "missing.desktop",
    "work",
    -1,
  ),
  -1,
);

const pinnedA = {
  launcherUrl: "app-a.desktop",
  pinnedLauncherUrl: "app-a.desktop",
};
const pinnedB = {
  launcherUrl: "app-b.desktop",
  pinnedLauncherUrl: "app-b.desktop",
};
const pinnedC = {
  launcherUrl: "app-c.desktop",
  pinnedLauncherUrl: "app-c.desktop",
};

assert.equal(
  helpers.pinnedLauncherGlobalPosition(visibleLaunchers, pinnedB, () => -1),
  1,
);
assert.equal(
  helpers.pinnedLauncherGlobalPosition(visibleLaunchers, {}, launcherPosition),
  -1,
);
assert.equal(
  helpers.canMovePinnedLauncher(
    visibleLaunchers,
    pinnedA,
    pinnedB,
    launcherPosition,
  ),
  true,
);
assert.equal(
  helpers.canMovePinnedLauncher(
    visibleLaunchers,
    pinnedA,
    pinnedA,
    launcherPosition,
  ),
  false,
);

assert.deepEqual(
  plain(
    helpers.movePinnedLauncher(
      visibleLaunchers,
      pinnedA,
      pinnedC,
      launcherPosition,
    ),
  ),
  {
    moved: true,
    launchers: [
      "[chat]\napp-b.desktop",
      "app-c.desktop",
      "[work]\napp-a.desktop",
    ],
  },
);
assert.deepEqual(
  plain(
    helpers.movePinnedLauncher(
      visibleLaunchers,
      pinnedA,
      pinnedA,
      launcherPosition,
    ),
  ),
  {
    moved: false,
    launchers: visibleLaunchers,
  },
);
