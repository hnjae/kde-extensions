// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const exportNames = [
  "launcherPinStateSnapshot",
  "pinActionState",
  "pinActionsSection",
  "pinLauncherAction",
  "pinLauncherCommand",
];

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuPinLogic.mjs",
    import.meta.url,
  ),
  exportNames,
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(
  plain(logic.pinActionState({ canPin: true, isPinned: true })),
  {
    action: "unpin",
    enabled: true,
    text: "Unpin from Task Manager",
  },
);
assert.deepEqual(
  plain(logic.pinActionState({ canPin: true, isPinned: false })),
  {
    action: "pin",
    enabled: true,
    text: "Pin to Task Manager",
  },
);
assert.deepEqual(
  plain(logic.pinActionState({ canPin: false, isPinned: true })),
  {
    action: "unpin",
    enabled: false,
    text: "Unpin from Task Manager",
  },
);
assert.deepEqual(
  plain(
    logic.pinLauncherCommand({ isPinned: false, launcherUrl: "app.desktop" }),
  ),
  {
    action: "pinLauncher",
    kind: "launcher-command",
    launcherUrl: "app.desktop",
    launchers: [],
  },
);
assert.deepEqual(
  plain(
    logic.pinLauncherCommand({ isPinned: true, launcherUrl: "app.desktop" }),
  ),
  {
    action: "unpinLauncher",
    kind: "launcher-command",
    launcherUrl: "app.desktop",
    launchers: [],
  },
);
assert.deepEqual(
  plain(
    logic.pinLauncherAction({
      canPin: true,
      isPinned: false,
      launcherUrl: "app.desktop",
    }),
  ),
  {
    action: "pin",
    command: {
      action: "pinLauncher",
      kind: "launcher-command",
      launcherUrl: "app.desktop",
      launchers: [],
    },
    enabled: true,
    text: "Pin to Task Manager",
  },
);
assert.equal(
  logic.pinLauncherAction({
    canPin: true,
    isPinned: true,
    launcherUrl: "app.desktop",
  }).icon,
  "window-unpin",
);
assert.equal(
  logic.pinLauncherAction({
    canPin: true,
    isPinned: false,
    launcherUrl: "app.desktop",
  }).icon,
  "window-pin",
);
assert.deepEqual(
  plain(
    logic.pinLauncherAction({
      canPin: true,
      isPinned: true,
      launcherUrl: "app.desktop",
    }),
  ),
  {
    action: "unpin",
    command: {
      action: "unpinLauncher",
      kind: "launcher-command",
      launcherUrl: "app.desktop",
      launchers: [],
    },
    enabled: true,
    text: "Unpin from Task Manager",
  },
);
assert.deepEqual(
  plain(
    logic.pinLauncherAction({
      canPin: false,
      isPinned: false,
      launcherUrl: "",
    }),
  ),
  {
    action: "pin",
    command: {
      action: "pinLauncher",
      kind: "launcher-command",
      launcherUrl: "",
      launchers: [],
    },
    enabled: false,
    text: "Pin to Task Manager",
  },
);
assert.deepEqual(
  plain(
    logic.pinActionsSection({
      canPin: true,
      isPinned: true,
      launcherUrl: "app.desktop",
    }),
  ),
  {
    pinLauncher: {
      action: "unpin",
      command: {
        action: "unpinLauncher",
        kind: "launcher-command",
        launcherUrl: "app.desktop",
        launchers: [],
      },
      enabled: true,
      text: "Unpin from Task Manager",
    },
  },
);
assert.deepEqual(
  plain(
    logic.launcherPinStateSnapshot(
      ["app.desktop"],
      "app.desktop",
      "work",
      () => 0,
    ),
  ),
  {
    canPin: true,
    isPinned: true,
    launcherUrl: "app.desktop",
    pinnedLauncherPosition: 0,
  },
);
assert.deepEqual(
  plain(logic.launcherPinStateSnapshot([], "app.desktop", "work", () => -1)),
  {
    canPin: true,
    isPinned: false,
    launcherUrl: "app.desktop",
    pinnedLauncherPosition: -1,
  },
);
assert.deepEqual(
  plain(
    logic.launcherPinStateSnapshot(
      ["[chat]\napp.desktop"],
      "app.desktop",
      "work",
      () => 0,
    ),
  ),
  {
    canPin: true,
    isPinned: false,
    launcherUrl: "app.desktop",
    pinnedLauncherPosition: -1,
  },
);
assert.deepEqual(
  plain(logic.launcherPinStateSnapshot(["app.desktop"], "", "work", () => 0)),
  {
    canPin: false,
    isPinned: false,
    launcherUrl: "",
    pinnedLauncherPosition: -1,
  },
);
