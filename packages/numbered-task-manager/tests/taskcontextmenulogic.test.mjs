// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.js", import.meta.url),
  [
    "boolRoleData",
    "basicActionRoleSnapshot",
    "captureCloseRoleSnapshot",
    "checkableWindowActionState",
    "checkableWindowCapabilityActionState",
    "closeAction",
    "closeActionSection",
    "closeCommand",
    "closeActionState",
    "activityEntriesSnapshot",
    "allTaskActivitiesAction",
    "allTaskActivitiesCommand",
    "allVirtualDesktopsAction",
    "allVirtualDesktopsCommand",
    "basicMoveAction",
    "basicResizeAction",
    "excludeFromCaptureAction",
    "excludeFromCaptureCommand",
    "fullscreenAction",
    "fullscreenCommand",
    "fullscreenShadeBorderRoleSnapshot",
    "menuActionSection",
    "menuActionSectionVisible",
    "moveCommand",
    "newVirtualDesktopAction",
    "newVirtualDesktopCommand",
    "newVirtualDesktopActionState",
    "launcherActivityListSnapshot",
    "launcherActivityMenuState",
    "launcherActivityUpdateCommand",
    "launcherActivityAction",
    "launcherAllActivitiesUpdateCommand",
    "launcherAllActivitiesAction",
    "launcherActivityToggleUpdateCommand",
    "launcherActivitiesAction",
    "launcherActivitiesActionState",
    "launcherActivitiesVisible",
    "launcherPinStateSnapshot",
    "keepAboveCommand",
    "keepAboveAction",
    "keepAboveBelowRoleSnapshot",
    "keepBelowCommand",
    "keepBelowAction",
    "maximizeCommand",
    "maximizeAction",
    "minimizeMaximizeRoleSnapshot",
    "minimizeCommand",
    "minimizeAction",
    "newInstanceAction",
    "newInstanceCommand",
    "newInstanceActionState",
    "noBorderAction",
    "noBorderCommand",
    "panelMenuPlacement",
    "pinActionState",
    "pinLauncherAction",
    "pinLauncherCommand",
    "replaceLauncherListCommand",
    "roleData",
    "resizeCommand",
    "shadeAction",
    "shadeCommand",
    "taskActivitiesAction",
    "taskActivityAction",
    "taskActivityMenuState",
    "taskActivityToggleCommand",
    "taskRoleSnapshot",
    "taskActivitiesActionState",
    "virtualDesktopAction",
    "virtualDesktopEntriesSnapshot",
    "virtualDesktopCommand",
    "virtualDesktopMenuState",
    "virtualDesktopRoleSnapshot",
    "virtualDesktopsAction",
    "virtualDesktopsActionState",
    "windowCapabilityActionState",
  ],
);

const plasmaCoreTypes = {
  BottomEdge: "bottom",
  LeftEdge: "left",
  RightEdge: "right",
  TopEdge: "top",
};

const plasmaMenu = {
  BottomPosedLeftAlignedPopup: "open-down",
  LeftPosedTopAlignedPopup: "open-left",
  RightPosedTopAlignedPopup: "open-right",
  TopPosedLeftAlignedPopup: "open-up",
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const nullActivityId = "00000000-0000-0000-0000-000000000000";

assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.BottomEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.TopPosedLeftAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.TopEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.BottomPosedLeftAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.LeftEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.RightPosedTopAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.RightEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.LeftPosedTopAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(undefined, plasmaCoreTypes, plasmaMenu),
  plasmaMenu.TopPosedLeftAlignedPopup,
);
assert.deepEqual(
  plain(
    logic.virtualDesktopEntriesSnapshot(["desktop-a", "desktop-b"], ["Work"]),
  ),
  [
    {
      id: "desktop-a",
      name: "Work",
    },
    {
      id: "desktop-b",
      name: "Desktop 2",
    },
  ],
);
assert.deepEqual(
  plain(logic.virtualDesktopEntriesSnapshot(null, ["Work"])),
  [],
);
assert.deepEqual(
  plain(
    logic.activityEntriesSnapshot(
      ["activity-a", 42],
      (id) => (id === "activity-a" ? "Work" : ""),
      (id) => `icon-${id}`,
    ),
  ),
  [
    {
      icon: "icon-activity-a",
      id: "activity-a",
      name: "Work",
    },
    {
      icon: "icon-42",
      id: "42",
      name: "42",
    },
  ],
);
assert.deepEqual(
  plain(logic.activityEntriesSnapshot(["activity-a"], null, null)),
  [
    {
      icon: "",
      id: "activity-a",
      name: "activity-a",
    },
  ],
);

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
assert.deepEqual(
  plain(
    logic.replaceLauncherListCommand(["app.desktop", "", null, "chat.desktop"]),
  ),
  {
    action: "replaceLauncherList",
    kind: "launcher-command",
    launcherUrl: "",
    launchers: ["app.desktop", "chat.desktop"],
  },
);
assert.deepEqual(
  plain(
    logic.newInstanceActionState({
      canLaunchNewInstance: true,
      hasTask: true,
      isLauncher: false,
    }),
  ),
  {
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.newInstanceActionState({
      canLaunchNewInstance: false,
      hasTask: true,
      isLauncher: true,
    }),
  ),
  {
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.newInstanceActionState({
      canLaunchNewInstance: false,
      hasTask: false,
      isLauncher: false,
    }),
  ),
  {
    enabled: false,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.newInstanceAction({
      canLaunchNewInstance: true,
      hasTask: true,
      isLauncher: false,
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestNewInstance",
    },
    enabled: true,
    text: "New Instance",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.newInstanceAction({
      canLaunchNewInstance: false,
      hasTask: false,
      isLauncher: false,
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestNewInstance",
    },
    enabled: false,
    text: "New Instance",
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.basicMoveAction({
      capable: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestMove",
    },
    enabled: true,
    text: "Move",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.basicResizeAction({
      capable: false,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestResize",
    },
    enabled: false,
    text: "Resize",
    visible: false,
  },
);
assert.deepEqual(plain(logic.newInstanceCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestNewInstance",
});
assert.deepEqual(plain(logic.moveCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestMove",
});
assert.deepEqual(plain(logic.resizeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestResize",
});
assert.deepEqual(plain(logic.minimizeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleMinimized",
});
assert.deepEqual(plain(logic.maximizeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleMaximized",
});
assert.deepEqual(
  plain(
    logic.minimizeAction({
      capable: true,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleMinimized",
    },
    enabled: true,
    text: "Minimize",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.maximizeAction({
      capable: false,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleMaximized",
    },
    enabled: false,
    text: "Maximize",
    visible: false,
  },
);
assert.deepEqual(plain(logic.keepAboveCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleKeepAbove",
});
assert.deepEqual(plain(logic.keepBelowCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleKeepBelow",
});
assert.deepEqual(
  plain(
    logic.keepAboveAction({
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleKeepAbove",
    },
    enabled: true,
    text: "Keep Above Others",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.keepBelowAction({
      checked: false,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    checked: false,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleKeepBelow",
    },
    enabled: false,
    text: "Keep Below Others",
    visible: true,
  },
);
assert.deepEqual(plain(logic.fullscreenCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleFullScreen",
});
assert.deepEqual(plain(logic.shadeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleShaded",
});
assert.deepEqual(plain(logic.noBorderCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleNoBorder",
});
assert.deepEqual(
  plain(
    logic.fullscreenAction({
      capable: true,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleFullScreen",
    },
    enabled: true,
    text: "Fullscreen",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.shadeAction({
      capable: false,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleShaded",
    },
    enabled: false,
    text: "Shade",
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.noBorderAction({
      capable: true,
      checked: false,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    checked: false,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleNoBorder",
    },
    enabled: false,
    text: "No Border",
    visible: true,
  },
);
assert.deepEqual(plain(logic.excludeFromCaptureCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestToggleExcludeFromCapture",
});
assert.deepEqual(plain(logic.closeCommand()), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestClose",
});
assert.deepEqual(
  plain(
    logic.excludeFromCaptureAction({
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestToggleExcludeFromCapture",
    },
    enabled: true,
    text: "Hide from Screencasts",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.closeAction({
      closable: true,
      hasTask: false,
      isWindow: true,
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestClose",
    },
    enabled: false,
    text: "Close",
    visible: true,
  },
);
assert.deepEqual(plain(logic.closeActionSection({ visible: false })), {
  visible: false,
});
assert.deepEqual(plain(logic.closeActionSection({ visible: true })), {
  visible: true,
});
assert.deepEqual(plain(logic.allTaskActivitiesCommand()), {
  arguments: [[]],
  kind: "task-model-request",
  requestMethod: "requestActivities",
});
assert.deepEqual(
  plain(
    logic.windowCapabilityActionState({
      capable: true,
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
    logic.windowCapabilityActionState({
      capable: false,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.windowCapabilityActionState({
      capable: true,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowCapabilityActionState({
      capable: true,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowCapabilityActionState({
      capable: false,
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    enabled: false,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowCapabilityActionState({
      capable: true,
      checked: false,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    checked: false,
    enabled: false,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowActionState({
      checked: true,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    enabled: true,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowActionState({
      checked: true,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    checked: true,
    enabled: false,
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.checkableWindowActionState({
      checked: false,
      hasWindowTask: true,
      isWindow: false,
    }),
  ),
  {
    checked: false,
    enabled: true,
    visible: false,
  },
);
assert.equal(
  logic.menuActionSectionVisible({
    hasWindowTask: false,
    launcherActivitiesVisible: false,
    newInstanceVisible: false,
  }),
  false,
);
assert.equal(
  logic.menuActionSectionVisible({
    hasWindowTask: true,
    launcherActivitiesVisible: false,
    newInstanceVisible: false,
  }),
  true,
);
assert.equal(
  logic.menuActionSectionVisible({
    hasWindowTask: false,
    launcherActivitiesVisible: true,
    newInstanceVisible: false,
  }),
  true,
);
assert.deepEqual(
  plain(
    logic.menuActionSection({
      hasWindowTask: false,
      launcherActivitiesVisible: false,
      newInstanceVisible: false,
    }),
  ),
  {
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.menuActionSection({
      hasWindowTask: false,
      launcherActivitiesVisible: false,
      newInstanceVisible: true,
    }),
  ),
  {
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.menuActionSection({
      hasWindowTask: true,
      launcherActivitiesVisible: false,
      newInstanceVisible: false,
    }),
  ),
  {
    visible: true,
  },
);
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
    logic.virtualDesktopsActionState({
      changeable: false,
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    visible: false,
  },
);
assert.deepEqual(
  plain(
    logic.virtualDesktopsActionState({
      changeable: true,
      hasWindowTask: false,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
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
    text: "Virtual Desktops",
    visible: true,
  },
);
assert.deepEqual(
  plain(logic.newVirtualDesktopActionState({ hasWindowTask: true })),
  {
    enabled: true,
  },
);
assert.deepEqual(
  plain(logic.newVirtualDesktopActionState({ hasWindowTask: false })),
  {
    enabled: false,
  },
);
assert.deepEqual(
  plain(logic.newVirtualDesktopAction({ hasWindowTask: false })),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestNewVirtualDesktop",
    },
    enabled: false,
    text: "New Desktop",
  },
);
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
      hasWindowTask: true,
      isWindow: true,
    }),
  ),
  {
    enabled: true,
    text: "Activities",
    visible: true,
  },
);
assert.deepEqual(
  plain(
    logic.closeActionState({
      closable: true,
      hasTask: true,
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
    logic.closeActionState({
      closable: false,
      hasTask: true,
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
    logic.closeActionState({
      closable: true,
      hasTask: false,
      isWindow: true,
    }),
  ),
  {
    enabled: false,
    visible: true,
  },
);
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
assert.deepEqual(
  plain(
    logic.launcherActivitiesActionState(
      { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
      2,
      false,
    ),
  ),
  {
    enabled: false,
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
    logic.launcherActivitiesActionState(
      { canPin: false, isPinned: true, launcherUrl: "" },
      2,
      true,
    ),
  ),
  {
    enabled: false,
    visible: false,
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
      "work",
    ),
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
    logic.launcherAllActivitiesUpdateCommand(
      ["one.desktop", "[work]\ntwo.desktop"],
      1,
      ["work"],
      "work",
    ),
  ),
  {
    activities: [nullActivityId],
    changed: true,
    command: {
      action: "replaceLauncherList",
      kind: "launcher-command",
      launcherUrl: "",
      launchers: ["one.desktop", "two.desktop"],
    },
    launchers: ["one.desktop", "two.desktop"],
    ok: true,
    reason: "updated",
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
      ["one.desktop", "two.desktop"],
      1,
      [nullActivityId],
      "chat",
      "work",
    ),
  ),
  {
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
);
assert.deepEqual(
  plain(
    logic.launcherActivityToggleUpdateCommand(
      ["one.desktop", "[work]\ntwo.desktop"],
      1,
      ["work"],
      "work",
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
      name: "Desktop A",
    }),
  ),
  {
    checked: true,
    command: {
      arguments: [["desktop-a"]],
      kind: "task-model-request",
      requestMethod: "requestVirtualDesktops",
    },
    text: "Desktop A",
  },
);
assert.deepEqual(
  plain(logic.virtualDesktopMenuState(["desktop-a"], false, "desktop-a")),
  {
    allDesktopsChecked: false,
    desktopChecked: true,
  },
);
assert.deepEqual(
  plain(logic.virtualDesktopMenuState(["desktop-a"], false, "desktop-b")),
  {
    allDesktopsChecked: false,
    desktopChecked: false,
  },
);
assert.deepEqual(
  plain(
    logic.virtualDesktopMenuState([{ id: "desktop-a" }], false, {
      id: "desktop-a",
    }),
  ),
  {
    allDesktopsChecked: false,
    desktopChecked: true,
  },
);
assert.equal(
  logic.launcherActivitiesVisible(
    { canPin: true, isPinned: true, launcherUrl: "app.desktop" },
    1,
  ),
  false,
);

const liveRoles = {
  Activities: ["live-activity"],
  CanSetNoBorder: true,
  CanLaunchNewInstance: true,
  HasNoBorder: false,
  IsClosable: true,
  IsExcludedFromCapture: false,
  IsKeepAbove: true,
  IsKeepBelow: false,
  IsFullScreen: true,
  IsFullScreenable: false,
  IsLauncher: 1,
  IsMaximizable: true,
  IsMaximized: false,
  IsMinimizable: false,
  IsMinimized: true,
  IsMovable: false,
  IsOnAllVirtualDesktops: true,
  IsResizable: true,
  IsShadeable: true,
  IsShaded: false,
  IsVirtualDesktopsChangeable: false,
  IsWindow: true,
  LauncherUrl: "launcher.desktop",
  LauncherUrlWithoutIcon: "launcher-without-icon.desktop",
  VirtualDesktops: ["live-desktop"],
};
const roleCalls = [];
const roleSource = {
  hasTask: true,
  modelIndex: { row: 5 },
  taskModel: {
    data(modelIndex, role) {
      roleCalls.push({ modelIndex, role });
      return liveRoles[role];
    },
  },
};
const roles = {
  Activities: "Activities",
  CanSetNoBorder: "CanSetNoBorder",
  CanLaunchNewInstance: "CanLaunchNewInstance",
  HasNoBorder: "HasNoBorder",
  IsClosable: "IsClosable",
  IsExcludedFromCapture: "IsExcludedFromCapture",
  IsFullScreen: "IsFullScreen",
  IsFullScreenable: "IsFullScreenable",
  IsKeepAbove: "IsKeepAbove",
  IsKeepBelow: "IsKeepBelow",
  IsLauncher: "IsLauncher",
  IsMaximizable: "IsMaximizable",
  IsMaximized: "IsMaximized",
  IsMinimizable: "IsMinimizable",
  IsMinimized: "IsMinimized",
  IsMovable: "IsMovable",
  IsOnAllVirtualDesktops: "IsOnAllVirtualDesktops",
  IsResizable: "IsResizable",
  IsShadeable: "IsShadeable",
  IsShaded: "IsShaded",
  IsVirtualDesktopsChangeable: "IsVirtualDesktopsChangeable",
  IsWindow: "IsWindow",
  LauncherUrl: "LauncherUrl",
  LauncherUrlWithoutIcon: "LauncherUrlWithoutIcon",
  VirtualDesktops: "VirtualDesktops",
};

assert.equal(
  logic.roleData(roleSource, "LauncherUrl", "fallback"),
  "launcher.desktop",
);
assert.equal(logic.roleData(roleSource, "Missing", "fallback"), "fallback");
assert.equal(
  logic.roleData({ ...roleSource, hasTask: false }, "LauncherUrl", "fallback"),
  "fallback",
);
assert.equal(logic.boolRoleData(roleSource, "IsLauncher", false), true);
assert.deepEqual(
  plain(
    logic.taskRoleSnapshot(roleSource, roles, {
      activities: ["fallback-activity"],
      isLauncher: false,
      isWindow: false,
      launcherUrl: "fallback.desktop",
      virtualDesktops: ["fallback-desktop"],
    }),
  ),
  {
    activities: ["live-activity"],
    isLauncher: true,
    isWindow: true,
    launcherUrl: "launcher-without-icon.desktop",
    virtualDesktops: ["live-desktop"],
  },
);
assert.deepEqual(
  plain(
    logic.taskRoleSnapshot({ ...roleSource, hasTask: false }, roles, {
      activities: ["fallback-activity"],
      isLauncher: false,
      isWindow: true,
      launcherUrl: "fallback.desktop",
      virtualDesktops: ["fallback-desktop"],
    }),
  ),
  {
    activities: ["fallback-activity"],
    isLauncher: false,
    isWindow: true,
    launcherUrl: "fallback.desktop",
    virtualDesktops: ["fallback-desktop"],
  },
);
assert.deepEqual(
  plain(
    logic.basicActionRoleSnapshot(roleSource, roles, {
      canLaunchNewInstance: false,
      isLauncher: false,
      isMovable: true,
      isResizable: false,
    }),
  ),
  {
    canLaunchNewInstance: true,
    isLauncher: true,
    isMovable: false,
    isResizable: true,
  },
);
assert.deepEqual(
  plain(
    logic.basicActionRoleSnapshot({ ...roleSource, hasTask: false }, roles, {
      canLaunchNewInstance: false,
      isLauncher: true,
      isMovable: true,
      isResizable: false,
    }),
  ),
  {
    canLaunchNewInstance: false,
    isLauncher: true,
    isMovable: true,
    isResizable: false,
  },
);
assert.deepEqual(
  plain(
    logic.minimizeMaximizeRoleSnapshot(roleSource, roles, {
      isMaximizable: false,
      isMaximized: true,
      isMinimizable: true,
      isMinimized: false,
    }),
  ),
  {
    isMaximizable: true,
    isMaximized: false,
    isMinimizable: false,
    isMinimized: true,
  },
);
assert.deepEqual(
  plain(
    logic.minimizeMaximizeRoleSnapshot(
      { ...roleSource, hasTask: false },
      roles,
      {
        isMaximizable: false,
        isMaximized: true,
        isMinimizable: true,
        isMinimized: false,
      },
    ),
  ),
  {
    isMaximizable: false,
    isMaximized: true,
    isMinimizable: true,
    isMinimized: false,
  },
);
assert.deepEqual(
  plain(
    logic.keepAboveBelowRoleSnapshot(roleSource, roles, {
      isKeepAbove: false,
      isKeepBelow: true,
    }),
  ),
  {
    isKeepAbove: true,
    isKeepBelow: false,
  },
);
assert.deepEqual(
  plain(
    logic.keepAboveBelowRoleSnapshot({ ...roleSource, hasTask: false }, roles, {
      isKeepAbove: false,
      isKeepBelow: true,
    }),
  ),
  {
    isKeepAbove: false,
    isKeepBelow: true,
  },
);
assert.deepEqual(
  plain(
    logic.fullscreenShadeBorderRoleSnapshot(roleSource, roles, {
      canSetNoBorder: false,
      fullScreenable: true,
      hasNoBorder: true,
      isFullScreen: false,
      isShadeable: false,
      isShaded: true,
    }),
  ),
  {
    canSetNoBorder: true,
    fullScreenable: false,
    hasNoBorder: false,
    isFullScreen: true,
    isShadeable: true,
    isShaded: false,
  },
);
assert.deepEqual(
  plain(
    logic.fullscreenShadeBorderRoleSnapshot(
      { ...roleSource, hasTask: false },
      roles,
      {
        canSetNoBorder: false,
        fullScreenable: true,
        hasNoBorder: true,
        isFullScreen: false,
        isShadeable: false,
        isShaded: true,
      },
    ),
  ),
  {
    canSetNoBorder: false,
    fullScreenable: true,
    hasNoBorder: true,
    isFullScreen: false,
    isShadeable: false,
    isShaded: true,
  },
);
assert.deepEqual(
  plain(
    logic.virtualDesktopRoleSnapshot(roleSource, roles, {
      isOnAllVirtualDesktops: false,
      isVirtualDesktopsChangeable: true,
    }),
  ),
  {
    isOnAllVirtualDesktops: true,
    isVirtualDesktopsChangeable: false,
  },
);
assert.deepEqual(
  plain(
    logic.virtualDesktopRoleSnapshot({ ...roleSource, hasTask: false }, roles, {
      isOnAllVirtualDesktops: false,
      isVirtualDesktopsChangeable: true,
    }),
  ),
  {
    isOnAllVirtualDesktops: false,
    isVirtualDesktopsChangeable: true,
  },
);
assert.deepEqual(
  plain(
    logic.captureCloseRoleSnapshot(roleSource, roles, {
      closable: false,
      isExcludedFromCapture: true,
    }),
  ),
  {
    closable: true,
    isExcludedFromCapture: false,
  },
);
assert.deepEqual(
  plain(
    logic.captureCloseRoleSnapshot({ ...roleSource, hasTask: false }, roles, {
      closable: false,
      isExcludedFromCapture: true,
    }),
  ),
  {
    closable: false,
    isExcludedFromCapture: true,
  },
);
assert.deepEqual(plain(roleCalls.map((call) => call.role).slice(0, 2)), [
  "LauncherUrl",
  "Missing",
]);

const menuQml = readFileSync(
  new URL("../package/contents/ui/TaskContextMenu.qml", import.meta.url),
  "utf8",
);

assert.equal(menuQml.includes("atm.HasLauncher"), false);
assert.equal(menuQml.includes("taskModel.data"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.taskRoleSnapshot"), true);
assert.equal(
  menuQml.includes(
    "readonly property var taskRoles: TaskContextMenuLogic.taskRoleSnapshot",
  ),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.activityEntriesSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopEntriesSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.basicActionRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.minimizeMaximizeRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.keepAboveBelowRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.fullscreenShadeBorderRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.captureCloseRoleSnapshot"),
  true,
);
assert.equal(
  menuQml.includes(
    "canLaunchNewInstance: root.boolRole(root.atm.CanLaunchNewInstance",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsMovable"),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsResizable"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsMinimized",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsMinimizable"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsMaximized",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsMaximizable"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsKeepAbove",
  ),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsKeepBelow",
  ),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsFullScreen",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsFullScreenable"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsShaded",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.IsShadeable"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.HasNoBorder",
  ),
  false,
);
assert.equal(
  menuQml.includes("capable: root.boolRole(root.atm.CanSetNoBorder"),
  false,
);
assert.equal(
  menuQml.includes(
    "changeable: root.boolRole(root.atm.IsVirtualDesktopsChangeable",
  ),
  false,
);
assert.equal(
  menuQml.includes("root.boolRole(root.atm.IsOnAllVirtualDesktops"),
  false,
);
assert.equal(
  menuQml.includes(
    "readonly property bool roleChecked: root.boolRole(root.atm.IsExcludedFromCapture",
  ),
  false,
);
assert.equal(
  menuQml.includes("closable: root.boolRole(root.atm.IsClosable"),
  false,
);
assert.equal(menuQml.includes('names[i] || "Desktop "'), false);
assert.equal(menuQml.includes("activityInfo.activityName(id) || id"), false);
assert.equal(menuQml.includes("function roleData"), false);
assert.equal(menuQml.includes("function boolRole"), false);
assert.equal(menuQml.includes("function roleSnapshot"), false);
assert.equal(menuQml.includes("root.roleSnapshot()"), false);
assert.equal(menuQml.includes("function isWindow"), false);
assert.equal(menuQml.includes("function isLauncher"), false);
assert.equal(menuQml.includes("function launcherUrl"), false);
assert.equal(menuQml.includes("function activities"), false);
assert.equal(menuQml.includes("function virtualDesktops"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityListSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityMenuState"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityUpdateCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherAllActivitiesUpdateCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivitiesAction("),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherAllActivitiesAction("),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityAction("),
  true,
);
assert.equal(menuQml.includes('text: "Launcher Activities"'), false);
assert.equal(menuQml.includes('text: "All Activities"'), false);
assert.equal(menuQml.includes("function setLauncherAllActivities"), false);
assert.equal(menuQml.includes("root.setLauncherAllActivities"), false);
assert.equal(
  menuQml.includes("LauncherListLogic.launcherActivitiesAfterAllToggle"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityToggleUpdateCommand"),
  false,
);
assert.equal(menuQml.includes("function toggleLauncherActivity"), false);
assert.equal(menuQml.includes("root.toggleLauncherActivity"), false);
assert.equal(
  menuQml.includes("LauncherListLogic.launcherActivitiesAfterToggle"),
  false,
);
assert.equal(
  menuQml.includes("LauncherListLogic.launcherActivityUpdate"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherPinStateSnapshot"),
  true,
);
assert.equal(menuQml.includes('import "LauncherListLogic.js"'), false);
assert.equal(menuQml.includes("LauncherListLogic.launcherPinState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivitiesActionState"),
  false,
);
assert.equal(
  menuQml.includes("enabled: Boolean(root.taskModel) && pinState.canPin"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivitiesVisible(pinState"),
  false,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.pinLauncherAction"), true);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.pinActionState(root.launcherPinState"),
  false,
);
assert.equal(
  menuQml.includes(
    "TaskContextMenuLogic.pinLauncherCommand(root.launcherPinState",
  ),
  false,
);
assert.equal(
  menuQml.includes('TaskActionLogic.contextMenuLauncherCommand("pinLauncher"'),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuLauncherCommand("unpinLauncher"',
  ),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.replaceLauncherListCommand"),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuLauncherCommand("replaceLauncherList"',
  ),
  false,
);
assert.equal(menuQml.includes("if (!update.ok)"), true);
assert.equal(menuQml.includes("if (!update)"), false);
assert.equal(menuQml.includes("function launcherPinnedToAllActivities"), false);
assert.equal(menuQml.includes("function launcherPinnedToActivity"), false);
assert.equal(menuQml.includes("function launcherActivityMenuState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivityMenuState"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivityToggleCommand"),
  false,
);
assert.equal(menuQml.includes("function toggleTaskActivity"), false);
assert.equal(menuQml.includes("root.toggleTaskActivity"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivitiesAction({"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.allTaskActivitiesAction"),
  true,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.taskActivityAction"), true);
assert.equal(menuQml.includes('text: "Activities"'), false);
assert.equal(
  menuQml.includes('import "TaskActivityLogic.js" as TaskActivityLogic'),
  false,
);
assert.equal(
  menuQml.includes("TaskActivityLogic.taskActivitiesAfterToggle"),
  false,
);
assert.equal(menuQml.includes("function taskOnAllActivities"), false);
assert.equal(menuQml.includes("function taskOnActivity"), false);
assert.equal(menuQml.includes("function taskActivityMenuState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopMenuState"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.allVirtualDesktopsCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.newVirtualDesktopCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopsAction({"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.allVirtualDesktopsAction"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopAction"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.newVirtualDesktopAction({"),
  true,
);
assert.equal(menuQml.includes('text: "Virtual Desktops"'), false);
assert.equal(menuQml.includes('text: "All Desktops"'), false);
assert.equal(menuQml.includes('text: "New Desktop"'), false);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestVirtualDesktops"',
  ),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestNewVirtualDesktop"',
  ),
  false,
);
assert.equal(menuQml.includes("function virtualDesktopMenuState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.newInstanceActionState"),
  false,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.newInstanceAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.basicMoveAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.basicResizeAction"), true);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.menuActionSection({"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.menuActionSectionVisible({"),
  false,
);
assert.equal(menuQml.includes('text: "New Instance"'), false);
assert.equal(menuQml.includes('text: "Move"'), false);
assert.equal(menuQml.includes('text: "Resize"'), false);
assert.equal(
  menuQml.includes("root.requestTaskModelCommand(actionState.command"),
  true,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestNewInstance"',
  ),
  false,
);
assert.equal(
  menuQml.includes('TaskActionLogic.contextMenuTaskCommand("requestMove"'),
  false,
);
assert.equal(
  menuQml.includes('TaskActionLogic.contextMenuTaskCommand("requestResize"'),
  false,
);
assert.equal(menuQml.includes("function newInstanceActionState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.windowCapabilityActionState"),
  false,
);
assert.equal(menuQml.includes("function windowCapabilityActionState"), false);
assert.equal(menuQml.includes("function menuActionSectionVisible"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.checkableWindowCapabilityActionState"),
  false,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.fullscreenAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.shadeAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.noBorderAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.fullscreenCommand"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.shadeCommand"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.noBorderCommand"), false);
assert.equal(menuQml.includes('text: "Fullscreen"'), false);
assert.equal(menuQml.includes('text: "Shade"'), false);
assert.equal(menuQml.includes('text: "No Border"'), false);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleFullScreen"',
  ),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleShaded"',
  ),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleNoBorder"',
  ),
  false,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.minimizeAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.maximizeAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.minimizeCommand"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.maximizeCommand"), false);
assert.equal(menuQml.includes('text: "Minimize"'), false);
assert.equal(menuQml.includes('text: "Maximize"'), false);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleMinimized"',
  ),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleMaximized"',
  ),
  false,
);
assert.equal(
  menuQml.includes("function checkableWindowCapabilityActionState"),
  false,
);
assert.equal(
  menuQml.includes(
    "TaskContextMenuLogic.checkableWindowActionState({\n            checked: root.keepAboveBelowRoles",
  ),
  false,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.keepAboveAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.keepBelowAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.keepAboveCommand"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.keepBelowCommand"), false);
assert.equal(menuQml.includes('text: "Keep Above Others"'), false);
assert.equal(menuQml.includes('text: "Keep Below Others"'), false);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleKeepAbove"',
  ),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleKeepBelow"',
  ),
  false,
);
assert.equal(menuQml.includes("function checkableWindowActionState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopsActionState"),
  false,
);
assert.equal(menuQml.includes("function virtualDesktopsActionState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.newVirtualDesktopActionState"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivitiesActionState"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.allTaskActivitiesCommand"),
  false,
);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestActivities"',
  ),
  false,
);
assert.equal(menuQml.includes("function taskActivitiesActionState"), false);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.excludeFromCaptureCommand"),
  false,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.excludeFromCaptureAction"),
  true,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.closeAction"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.closeActionSection"), true);
assert.equal(menuQml.includes("TaskContextMenuLogic.closeActionState"), false);
assert.equal(menuQml.includes("TaskContextMenuLogic.closeCommand"), false);
assert.equal(menuQml.includes("visible: closeItem.visible"), false);
assert.equal(menuQml.includes('text: "Hide from Screencasts"'), false);
assert.equal(menuQml.includes('text: "Close"'), false);
assert.equal(
  menuQml.includes(
    'TaskActionLogic.contextMenuTaskCommand("requestToggleExcludeFromCapture"',
  ),
  false,
);
assert.equal(
  menuQml.includes('TaskActionLogic.contextMenuTaskCommand("requestClose"'),
  false,
);
assert.equal(menuQml.includes("function newVirtualDesktopActionState"), false);
assert.equal(menuQml.includes("function closeActionState"), false);
assert.equal(
  menuQml.includes(
    "TaskContextMenuLogic.checkableWindowActionState({\n            checked: root.captureCloseRoles",
  ),
  false,
);
assert.equal(
  /checked: root\.boolRole\(root\.atm\.(?:IsKeepAbove|IsKeepBelow|IsFullScreen|IsShaded|HasNoBorder|IsExcludedFromCapture)\b/.test(
    menuQml,
  ),
  false,
);
assert.equal(
  /(?:enabled|visible): root\.(?:hasTask|hasWindowTask|isWindow\(\))/.test(
    menuQml,
  ),
  false,
);
assert.equal(menuQml.includes("TaskActionLogic.contextMenuTaskRequest"), true);
assert.equal(menuQml.includes("TaskActionLogic.contextMenuTaskCommand"), false);
assert.equal(
  menuQml.includes("TaskActionLogic.contextMenuTaskExecutionResult"),
  true,
);
assert.equal(
  /try\s*\{[\s\S]*?taskModel\[result\.requestMethod\]/.test(menuQml),
  true,
);
assert.equal(
  menuQml.includes("TaskActionLogic.contextMenuLauncherCommand"),
  false,
);
assert.equal(menuQml.includes("function requestTaskModelAction"), false);
assert.equal(menuQml.includes("signal pinRequested"), false);
assert.equal(menuQml.includes("signal unpinRequested"), false);
assert.equal(menuQml.includes("signal launcherListChangeRequested"), false);
assert.equal(/\b(?:root\.)?taskModel\.request[A-Z]/.test(menuQml), false);

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
assert.equal(
  mainQml.includes(
    "launcherCommandRequested.connect(root.dispatchLauncherCommand)",
  ),
  true,
);
assert.equal(
  mainQml.includes("TaskActionLogic.contextMenuLauncherCommandDispatchResult"),
  true,
);
assert.equal(mainQml.includes("pinRequested.connect"), false);
assert.equal(mainQml.includes("unpinRequested.connect"), false);
assert.equal(mainQml.includes("launcherListChangeRequested.connect"), false);

const sourceFiles = [
  "../package/contents/ui/AttentionItem.qml",
  "../package/contents/ui/NormalTaskSource.qml",
  "../package/contents/ui/RemoteAttentionLogic.js",
  "../package/contents/ui/RemoteAttentionSource.qml",
  "../package/contents/ui/TaskContextMenuLogic.js",
  "../package/contents/ui/TaskItem.qml",
  "../package/contents/ui/TaskModelLogic.js",
  "../package/contents/ui/main.qml",
];
for (const sourceFile of sourceFiles) {
  const sourceText = readFileSync(new URL(sourceFile, import.meta.url), "utf8");
  assert.equal(
    sourceText.includes("LauncherUrlWithoutIcon || model.LauncherUrl"),
    false,
  );
  assert.equal(sourceText.includes('"application-x-executable"'), false);
  assert.equal(sourceText.includes('"dialog-warning"'), false);
}

function directMenuContentObjectViolations(qml) {
  const violations = [];
  const menuStack = [];
  let depth = 0;

  for (const [index, line] of qml.split("\n").entries()) {
    const objectMatch = line.match(
      /^\s*(?:(?:readonly\s+)?property\s+[\w.]+\s+\w+\s*:\s*)?([\w.]+)\s*\{/,
    );
    const isPropertyObject =
      /^\s*(?:readonly\s+)?property\s+[\w.]+\s+\w+\s*:/.test(line);
    const topMenu = menuStack.at(-1);

    if (
      objectMatch &&
      !isPropertyObject &&
      topMenu &&
      depth === topMenu.contentDepth &&
      objectMatch[1] !== "PlasmaExtras.MenuItem"
    ) {
      violations.push({
        line: index + 1,
        type: objectMatch[1],
      });
    }

    if (objectMatch && objectMatch[1] === "PlasmaExtras.Menu") {
      menuStack.push({
        contentDepth: depth + 1,
      });
    }

    for (const character of line) {
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        while (menuStack.length > 0 && depth < menuStack.at(-1).contentDepth) {
          menuStack.pop();
        }
      }
    }
  }

  return violations;
}

assert.deepEqual(directMenuContentObjectViolations(menuQml), []);
