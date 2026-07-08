// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherActivityLogic.mjs", import.meta.url),
  [
    "effectiveSerializedLauncherActivities",
    "launcherActivitiesAfterAllToggle",
    "launcherActivitiesAfterToggle",
    "launcherActivityUpdate",
    "launcherListWithActivitiesAt",
    "parseSerializedLauncher",
    "serializeLauncherWithActivities",
    "serializedLauncherVisibleInActivity",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

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

assert.equal(
  helpers.serializedLauncherVisibleInActivity("[work]\napp.desktop", "work"),
  true,
);
assert.equal(
  helpers.serializedLauncherVisibleInActivity("[chat]\napp.desktop", "work"),
  false,
);

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
  plain(
    helpers.launcherActivityUpdate(["one.desktop", "two.desktop"], 1, ["work"]),
  ),
  {
    activities: ["work"],
    changed: true,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "updated",
  },
);
assert.deepEqual(
  plain(
    helpers.launcherActivityUpdate(["one.desktop", "[work]\ntwo.desktop"], 1, [
      "work",
    ]),
  ),
  {
    activities: ["work"],
    changed: false,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "unchanged",
  },
);
assert.deepEqual(
  plain(helpers.launcherActivityUpdate(["one.desktop"], 3, ["work"])),
  {
    activities: [],
    changed: false,
    launchers: ["one.desktop"],
    ok: false,
    reason: "invalid-position",
  },
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
