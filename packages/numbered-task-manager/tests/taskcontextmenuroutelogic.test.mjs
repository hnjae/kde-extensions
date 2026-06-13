// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuRouteLogic.mjs",
    import.meta.url,
  ),
  [
    "CONTEXT_MENU_LAUNCHER_COMMAND_KIND",
    "CONTEXT_MENU_TASK_MODEL_REQUEST_KIND",
    "CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE",
    "CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND",
    "CONTEXT_MENU_ROUTE_NONE",
    "CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST",
    "CONTEXT_MENU_ROUTE_UNAVAILABLE",
    "contextMenuActionRoute",
    "isLauncherActivityUpdateRoute",
    "isLauncherCommandRoute",
    "isNoneRoute",
    "isTaskModelRequestRoute",
    "isUnavailableRoute",
  ],
);

const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(logic.CONTEXT_MENU_LAUNCHER_COMMAND_KIND, "launcher-command");
assert.equal(logic.CONTEXT_MENU_TASK_MODEL_REQUEST_KIND, "task-model-request");
assert.equal(logic.CONTEXT_MENU_ROUTE_UNAVAILABLE, "unavailable");
assert.equal(
  logic.CONTEXT_MENU_ROUTE_LAUNCHER_ACTIVITY_UPDATE,
  "launcher-activity-update",
);
assert.equal(logic.CONTEXT_MENU_ROUTE_LAUNCHER_COMMAND, "launcher-command");
assert.equal(logic.CONTEXT_MENU_ROUTE_TASK_MODEL_REQUEST, "task-model-request");
assert.equal(logic.CONTEXT_MENU_ROUTE_NONE, "none");

const launcherCommand = {
  action: "pinLauncher",
  kind: "launcher-command",
  launcherUrl: "app.desktop",
  launchers: [],
};
const taskModelCommand = {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestMove",
};
const unknownCommand = {
  requestMethod: "requestResize",
};
const update = {
  changed: true,
  ok: true,
};

const launcherRoute = logic.contextMenuActionRoute({
  command: launcherCommand,
});
assert.deepEqual(plain(launcherRoute), {
  command: launcherCommand,
  kind: "launcher-command",
  update: null,
});
assert.equal(logic.isLauncherCommandRoute(launcherRoute), true);
assert.equal(logic.isTaskModelRequestRoute(launcherRoute), false);

const taskModelRoute = logic.contextMenuActionRoute({
  command: taskModelCommand,
});
assert.deepEqual(plain(taskModelRoute), {
  command: taskModelCommand,
  kind: "task-model-request",
  update: null,
});
assert.equal(logic.isTaskModelRequestRoute(taskModelRoute), true);
assert.equal(logic.isLauncherCommandRoute(taskModelRoute), false);

assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: unknownCommand,
    }),
  ),
  {
    command: unknownCommand,
    kind: "task-model-request",
    update: null,
  },
);

const updateRoute = logic.contextMenuActionRoute({
  command: launcherCommand,
  update,
});
assert.deepEqual(plain(updateRoute), {
  command: null,
  kind: "launcher-activity-update",
  update,
});
assert.equal(logic.isLauncherActivityUpdateRoute(updateRoute), true);
assert.equal(logic.isLauncherCommandRoute(updateRoute), false);

const disabledRoute = logic.contextMenuActionRoute({
  command: taskModelCommand,
  enabled: false,
  update,
  visible: true,
});
assert.deepEqual(plain(disabledRoute), {
  code: "action-disabled",
  command: taskModelCommand,
  kind: "unavailable",
  update,
});
assert.equal(logic.isUnavailableRoute(disabledRoute), true);
assert.equal(logic.isTaskModelRequestRoute(disabledRoute), false);

assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: taskModelCommand,
      enabled: false,
      update,
      visible: false,
    }),
  ),
  {
    code: "action-hidden",
    command: taskModelCommand,
    kind: "unavailable",
    update,
  },
);

const noneRoute = logic.contextMenuActionRoute(null);
assert.deepEqual(plain(noneRoute), {
  command: null,
  kind: "none",
  update: null,
});
assert.equal(logic.isNoneRoute(noneRoute), true);
assert.equal(logic.isUnavailableRoute(noneRoute), false);

assert.equal(logic.isUnavailableRoute(null), false);
assert.equal(logic.isLauncherActivityUpdateRoute({}), false);
assert.equal(
  logic.isLauncherCommandRoute({ kind: "task-model-request" }),
  false,
);
assert.equal(
  logic.isTaskModelRequestRoute({ kind: "launcher-command" }),
  false,
);
assert.equal(logic.isNoneRoute({ kind: "unavailable" }), false);
