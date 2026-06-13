// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const exportNames = [
  "allVirtualDesktopsAction",
  "allVirtualDesktopsCommand",
  "newVirtualDesktopAction",
  "newVirtualDesktopActionState",
  "newVirtualDesktopCommand",
  "virtualDesktopAction",
  "virtualDesktopActionsSection",
  "virtualDesktopCommand",
  "virtualDesktopMenuState",
  "virtualDesktopsAction",
  "virtualDesktopsActionState",
];

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuVirtualDesktopLogic.mjs",
    import.meta.url,
  ),
  exportNames,
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(
  plain(
    logic.virtualDesktopsActionState({
      changeable: true,
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
    logic.virtualDesktopsAction({
      changeable: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: true,
    text: "Move to Desktop",
    visible: true,
  },
);
assert.equal(
  logic.virtualDesktopsAction({
    changeable: true,
    hasWindowTask: true,
    isWindow: true,
  }).icon,
  "virtual-desktops",
);
assert.deepEqual(plain(logic.newVirtualDesktopActionState({})), {
  enabled: false,
});
assert.deepEqual(
  plain(logic.newVirtualDesktopAction({ hasWindowTask: true })),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestNewVirtualDesktop",
    },
    enabled: true,
    text: "New Desktop",
  },
);
assert.equal(
  logic.newVirtualDesktopAction({ hasWindowTask: true }).icon,
  "list-add",
);
assert.deepEqual(plain(logic.virtualDesktopMenuState([], true, "desktop-a")), {
  allDesktopsChecked: true,
  desktopChecked: true,
});
assert.deepEqual(plain(logic.allVirtualDesktopsCommand()), {
  arguments: [[]],
  kind: "task-model-request",
  requestMethod: "requestVirtualDesktops",
});
assert.deepEqual(plain(logic.virtualDesktopCommand("desktop-a")), {
  arguments: [["desktop-a"]],
  kind: "task-model-request",
  requestMethod: "requestVirtualDesktops",
});
assert.deepEqual(plain(logic.newVirtualDesktopCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestNewVirtualDesktop",
});
assert.deepEqual(plain(logic.allVirtualDesktopsAction([], true)), {
  checked: true,
  command: {
    arguments: [[]],
    kind: "task-model-request",
    requestMethod: "requestVirtualDesktops",
  },
  text: "All Desktops",
});
assert.deepEqual(
  plain(
    logic.virtualDesktopAction(["desktop-a"], false, {
      id: "desktop-a",
      name: "Work",
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [["desktop-a"]],
      kind: "task-model-request",
      requestMethod: "requestVirtualDesktops",
    },
    text: "Work",
  },
);

const virtualDesktopSection = logic.virtualDesktopActionsSection({
  changeable: true,
  hasWindowTask: true,
  isOnAllVirtualDesktops: false,
  isWindow: true,
  virtualDesktops: ["desktop-a"],
});
assert.equal(typeof virtualDesktopSection.desktopAction, "function");
assert.deepEqual(
  plain({
    allVirtualDesktops: virtualDesktopSection.allVirtualDesktops,
    newVirtualDesktop: virtualDesktopSection.newVirtualDesktop,
    virtualDesktop: virtualDesktopSection.desktopAction({
      id: "desktop-a",
      name: "Work",
    }),
    virtualDesktops: virtualDesktopSection.virtualDesktops,
  }),
  {
    allVirtualDesktops: {
      checked: false,
      command: {
        arguments: [[]],
        kind: "task-model-request",
        requestMethod: "requestVirtualDesktops",
      },
      text: "All Desktops",
    },
    newVirtualDesktop: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestNewVirtualDesktop",
      },
      enabled: true,
      text: "New Desktop",
    },
    virtualDesktop: {
      checked: true,
      command: {
        arguments: [["desktop-a"]],
        kind: "task-model-request",
        requestMethod: "requestVirtualDesktops",
      },
      text: "Work",
    },
    virtualDesktops: {
      enabled: true,
      text: "Move to Desktop",
      visible: true,
    },
  },
);
