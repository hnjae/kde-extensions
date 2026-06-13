// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuTaskActivityLogic.mjs",
    import.meta.url,
  ),
  [
    "allTaskActivitiesAction",
    "allTaskActivitiesCommand",
    "taskActivitiesAction",
    "taskActivitiesActionState",
    "taskActivityAction",
    "taskActivityActionsSection",
    "taskActivityMenuState",
    "taskActivityToggleCommand",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(logic.taskActivityMenuState([], "work")), {
  activityChecked: true,
  allActivitiesChecked: true,
});
assert.deepEqual(plain(logic.taskActivityMenuState([nullActivityId], "work")), {
  activityChecked: true,
  allActivitiesChecked: true,
});
assert.deepEqual(plain(logic.taskActivityMenuState(["chat"], "work")), {
  activityChecked: false,
  allActivitiesChecked: false,
});
assert.deepEqual(plain(logic.taskActivityMenuState(["chat"], "chat")), {
  activityChecked: true,
  allActivitiesChecked: false,
});
assert.deepEqual(
  plain(
    logic.taskActivitiesActionState({
      activityEntryCount: 2,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.taskActivitiesActionState({
      activityEntryCount: 1,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: true,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.taskActivitiesAction({
      activityEntryCount: 2,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    text: "Activities",
    visible: true,
  },
);
assert.equal(logic.taskActivitiesAction({}).icon, "activities");
assert.deepEqual(plain(logic.allTaskActivitiesCommand()), {
  arguments: [[]],
  kind: "task-model-request",
  requestMethod: "requestActivities",
});
assert.deepEqual(plain(logic.allTaskActivitiesAction([nullActivityId])), {
  checked: true,
  command: {
    arguments: [[]],
    kind: "task-model-request",
    requestMethod: "requestActivities",
  },
  text: "All Activities",
});
assert.deepEqual(
  plain(logic.taskActivityToggleCommand([nullActivityId], "work")),
  {
    arguments: [["work"]],
    kind: "task-model-request",
    requestMethod: "requestActivities",
  },
);
assert.deepEqual(plain(logic.taskActivityToggleCommand(["work"], "chat")), {
  arguments: [["work", "chat"]],
  kind: "task-model-request",
  requestMethod: "requestActivities",
});
assert.deepEqual(
  plain(
    logic.taskActivityAction(["work"], {
      id: "chat",
      name: "Chat",
    }),
  ),
  {
    checked: false,
    command: {
      arguments: [["work", "chat"]],
      kind: "task-model-request",
      requestMethod: "requestActivities",
    },
    text: "Chat",
  },
);
{
  const taskActivitySection = logic.taskActivityActionsSection({
    activities: ["work"],
    activityEntryCount: 2,
    hasWindowTask: false,
    isWindow: true,
  });
  assert.equal(typeof taskActivitySection.activityAction, "function");
  assert.deepEqual(
    plain({
      allTaskActivities: taskActivitySection.allTaskActivities,
      taskActivities: taskActivitySection.taskActivities,
      taskActivity: taskActivitySection.activityAction({
        id: "chat",
        name: "Chat",
      }),
    }),
    {
      allTaskActivities: {
        checked: false,
        command: {
          arguments: [[]],
          kind: "task-model-request",
          requestMethod: "requestActivities",
        },
        text: "All Activities",
      },
      taskActivities: {
        enabled: false,
        text: "Activities",
        visible: true,
      },
      taskActivity: {
        checked: false,
        command: {
          arguments: [["work", "chat"]],
          kind: "task-model-request",
          requestMethod: "requestActivities",
        },
        text: "Chat",
      },
    },
  );
}
