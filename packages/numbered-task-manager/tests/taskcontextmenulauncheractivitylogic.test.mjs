// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuLauncherActivityLogic.mjs",
    import.meta.url,
  ),
  [
    "launcherActivitiesAction",
    "launcherActivitiesActionState",
    "launcherActivitiesVisible",
    "launcherActivityAction",
    "launcherActivityActionsSection",
    "launcherActivityListSnapshot",
    "launcherActivityMenuState",
    "launcherActivityToggleUpdateCommand",
    "launcherActivityUpdateCommand",
    "launcherAllActivitiesAction",
    "launcherAllActivitiesUpdateCommand",
    "replaceLauncherListCommand",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(
  logic.launcherActivitiesVisible(
    { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
    2,
  ),
  true,
);
assert.equal(
  logic.launcherActivitiesVisible(
    { canPin: true, isPinned: false, launcherUrl: "app.desktop" },
    2,
  ),
  false,
);
assert.equal(
  logic.launcherActivitiesVisible(
    { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
    1,
  ),
  false,
);
assert.deepEqual(
  plain(
    logic.launcherActivitiesActionState(
      { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
      2,
      true,
    ),
  ),
  {
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivitiesActionState(
      { canPin: true, isPinned: false, launcherUrl: "app.desktop" },
      2,
      true,
    ),
  ),
  {
    enabled: true,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivitiesAction(
      { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
      2,
      true,
    ),
  ),
  {
    enabled: true,
    text: "Launcher Activities",
    visible: true,
  },
);
assert.equal(
  logic.launcherActivitiesAction(
    { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
    2,
    true,
  ).icon,
  "window-pin",
);

assert.deepEqual(
  plain(logic.replaceLauncherListCommand(["app.desktop", "", null])),
  {
    action: "replaceLauncherList",
    kind: "launcher-command",
    launcherUrl: "",
    launchers: ["app.desktop"],
  },
);
assert.deepEqual(plain(logic.launcherActivityListSnapshot([])), [
  nullActivityId,
]);
assert.deepEqual(plain(logic.launcherActivityListSnapshot([nullActivityId])), [
  nullActivityId,
]);
assert.deepEqual(
  plain(logic.launcherActivityListSnapshot(["work", "work", ""])),
  ["work"],
);
assert.deepEqual(plain(logic.launcherActivityMenuState([], "work")), {
  activities: [nullActivityId],
  activityChecked: true,
  allActivitiesChecked: true,
});
assert.deepEqual(plain(logic.launcherActivityMenuState(["chat"], "work")), {
  activities: ["chat"],
  activityChecked: false,
  allActivitiesChecked: false,
});
assert.deepEqual(plain(logic.launcherActivityMenuState(["chat"], "chat")), {
  activities: ["chat"],
  activityChecked: true,
  allActivitiesChecked: false,
});

assert.deepEqual(
  plain(
    logic.launcherAllActivitiesAction(
      ["one.desktop", "two.desktop"],
      1,
      [nullActivityId],
      "work",
    ),
  ),
  {
    checked: true,
    text: "All Activities",
    update: {
      activities: ["work"],
      changed: true,
      command: {
        action: "replaceLauncherList",
        kind: "launcher-command",
        launcherUrl: "",
        launchers: ["one.desktop", "[work]\ntwo.desktop"],
      },
      launchers: ["one.desktop", "[work]\ntwo.desktop"],
      ok: true,
      reason: "updated",
    },
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivityAction(
      ["one.desktop", "two.desktop"],
      1,
      [nullActivityId],
      { id: "chat", name: "Chat" },
      "work",
    ),
  ),
  {
    checked: true,
    text: "Chat",
    update: {
      activities: ["chat"],
      changed: true,
      command: {
        action: "replaceLauncherList",
        kind: "launcher-command",
        launcherUrl: "",
        launchers: ["one.desktop", "[chat]\ntwo.desktop"],
      },
      launchers: ["one.desktop", "[chat]\ntwo.desktop"],
      ok: true,
      reason: "updated",
    },
  },
);

const launcherActivitySection = logic.launcherActivityActionsSection({
  activityEntryCount: 2,
  currentActivity: "work",
  hasTaskModel: true,
  launcherActivities: [nullActivityId],
  launcherList: ["one.desktop", "two.desktop"],
  launcherPosition: 1,
  pinState: {
    canPin: true,
    isPinned: true,
    launcherUrl: "app.desktop",
  },
});
assert.equal(typeof launcherActivitySection.activityAction, "function");
assert.deepEqual(
  plain({
    allLauncherActivities: launcherActivitySection.allLauncherActivities,
    launcherActivities: launcherActivitySection.launcherActivities,
    launcherActivity: launcherActivitySection.activityAction({
      id: "chat",
      name: "Chat",
    }),
  }),
  {
    allLauncherActivities: {
      checked: true,
      text: "All Activities",
      update: {
        activities: ["work"],
        changed: true,
        command: {
          action: "replaceLauncherList",
          kind: "launcher-command",
          launcherUrl: "",
          launchers: ["one.desktop", "[work]\ntwo.desktop"],
        },
        launchers: ["one.desktop", "[work]\ntwo.desktop"],
        ok: true,
        reason: "updated",
      },
    },
    launcherActivities: {
      enabled: true,
      text: "Launcher Activities",
      visible: true,
    },
    launcherActivity: {
      checked: true,
      text: "Chat",
      update: {
        activities: ["chat"],
        changed: true,
        command: {
          action: "replaceLauncherList",
          kind: "launcher-command",
          launcherUrl: "",
          launchers: ["one.desktop", "[chat]\ntwo.desktop"],
        },
        launchers: ["one.desktop", "[chat]\ntwo.desktop"],
        ok: true,
        reason: "updated",
      },
    },
  },
);

assert.deepEqual(
  plain(
    logic.launcherActivityUpdateCommand(["one.desktop", "two.desktop"], 1, [
      "work",
    ]),
  ),
  {
    activities: ["work"],
    changed: true,
    command: {
      action: "replaceLauncherList",
      kind: "launcher-command",
      launcherUrl: "",
      launchers: ["one.desktop", "[work]\ntwo.desktop"],
    },
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "updated",
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivityUpdateCommand(
      ["one.desktop", "[work]\ntwo.desktop"],
      1,
      ["work"],
    ),
  ),
  {
    activities: ["work"],
    changed: false,
    command: null,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "unchanged",
  },
);
assert.deepEqual(
  plain(logic.launcherActivityUpdateCommand(["one.desktop"], 3, ["work"])),
  {
    activities: [],
    changed: false,
    command: null,
    launchers: ["one.desktop"],
    ok: false,
    reason: "invalid-position",
  },
);
assert.deepEqual(
  plain(
    logic.launcherAllActivitiesUpdateCommand(
      ["one.desktop", "two.desktop"],
      1,
      [nullActivityId],
      "",
    ),
  ),
  {
    activities: [nullActivityId],
    changed: false,
    command: null,
    launchers: ["one.desktop", "two.desktop"],
    ok: false,
    reason: "missing-current-activity",
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivityToggleUpdateCommand(
      ["one.desktop", "[work]\ntwo.desktop"],
      1,
      ["work"],
      "chat",
      "work",
    ),
  ),
  {
    activities: ["work", "chat"],
    changed: true,
    command: {
      action: "replaceLauncherList",
      kind: "launcher-command",
      launcherUrl: "",
      launchers: ["one.desktop", "[work,chat]\ntwo.desktop"],
    },
    launchers: ["one.desktop", "[work,chat]\ntwo.desktop"],
    ok: true,
    reason: "updated",
  },
);
assert.deepEqual(
  plain(
    logic.launcherActivityToggleUpdateCommand(
      ["one.desktop", "[work]\ntwo.desktop"],
      1,
      ["work"],
      "",
      "work",
    ),
  ),
  {
    activities: ["work"],
    changed: false,
    command: null,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "unchanged",
  },
);
