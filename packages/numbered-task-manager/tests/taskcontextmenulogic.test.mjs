// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const facade = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.mjs", import.meta.url),
  ["contextMenuActionSections"],
);
const routeLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuRouteLogic.mjs",
    import.meta.url,
  ),
  ["contextMenuActionRoute"],
);
const roleLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuRoleLogic.mjs",
    import.meta.url,
  ),
  [
    "boolRoleData",
    "basicActionRoleSnapshot",
    "captureCloseRoleSnapshot",
    "contextMenuRoleSnapshots",
    "fullscreenShadeBorderRoleSnapshot",
    "keepAboveBelowRoleSnapshot",
    "minimizeMaximizeRoleSnapshot",
    "roleData",
    "taskRoleSnapshot",
    "virtualDesktopRoleSnapshot",
  ],
);
const launcherActivityLogic = await loadQmlJsModule(
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
const pinLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuPinLogic.mjs",
    import.meta.url,
  ),
  [
    "launcherPinStateSnapshot",
    "pinActionState",
    "pinActionsSection",
    "pinLauncherAction",
    "pinLauncherCommand",
  ],
);
const taskActivityLogic = await loadQmlJsModule(
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
const virtualDesktopLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuVirtualDesktopLogic.mjs",
    import.meta.url,
  ),
  [
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
  ],
);
const windowActionLogic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuWindowActionLogic.mjs",
    import.meta.url,
  ),
  [
    "basicActionsSection",
    "basicMoveAction",
    "basicResizeAction",
    "captureActionsSection",
    "checkableWindowActionState",
    "checkableWindowCapabilityActionState",
    "closeAction",
    "closeActionSection",
    "closeActionState",
    "closeActionsSection",
    "closeCommand",
    "excludeFromCaptureAction",
    "excludeFromCaptureCommand",
    "fullscreenAction",
    "fullscreenCommand",
    "fullscreenShadeBorderActionsSection",
    "keepAboveAction",
    "keepAboveBelowActionsSection",
    "keepAboveCommand",
    "keepBelowAction",
    "keepBelowCommand",
    "maximizeAction",
    "maximizeCommand",
    "menuActionSection",
    "menuActionSectionVisible",
    "minimizeAction",
    "minimizeCommand",
    "minimizeMaximizeActionsSection",
    "moveCommand",
    "newInstanceAction",
    "newInstanceActionState",
    "newInstanceCommand",
    "noBorderAction",
    "noBorderCommand",
    "resizeCommand",
    "shadeAction",
    "shadeCommand",
    "windowCapabilityActionState",
  ],
);
const logic = Object.assign(
  {},
  facade,
  routeLogic,
  roleLogic,
  launcherActivityLogic,
  pinLogic,
  taskActivityLogic,
  virtualDesktopLogic,
  windowActionLogic,
);

const plain = (value) => JSON.parse(JSON.stringify(value));
const nullActivityId = "00000000-0000-0000-0000-000000000000";

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
    logic.contextMenuActionRoute({
      command: logic.pinLauncherCommand({
        isPinned: false,
        launcherUrl: "app.desktop",
      }),
    }),
  ),
  {
    command: {
      action: "pinLauncher",
      kind: "launcher-command",
      launcherUrl: "app.desktop",
      launchers: [],
    },
    kind: "launcher-command",
    update: null,
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: logic.moveCommand(),
    }),
  ),
  {
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestMove",
    },
    kind: "task-model-request",
    update: null,
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: {
        requestMethod: "requestResize",
      },
    }),
  ),
  {
    command: {
      requestMethod: "requestResize",
    },
    kind: "task-model-request",
    update: null,
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      update: {
        changed: true,
        ok: true,
      },
    }),
  ),
  {
    command: null,
    kind: "launcher-activity-update",
    update: {
      changed: true,
      ok: true,
    },
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: logic.resizeCommand(),
      enabled: false,
      visible: true,
    }),
  ),
  {
    code: "action-disabled",
    command: {
      arguments: [],
      kind: "task-model-request",
      requestMethod: "requestResize",
    },
    kind: "unavailable",
    update: null,
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      enabled: true,
      update: {
        changed: true,
        ok: true,
      },
      visible: false,
    }),
  ),
  {
    code: "action-hidden",
    command: null,
    kind: "unavailable",
    update: {
      changed: true,
      ok: true,
    },
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: logic.pinLauncherCommand({
        isPinned: false,
        launcherUrl: "app.desktop",
      }),
      enabled: false,
    }),
  ),
  {
    code: "action-disabled",
    command: {
      action: "pinLauncher",
      kind: "launcher-command",
      launcherUrl: "app.desktop",
      launchers: [],
    },
    kind: "unavailable",
    update: null,
  },
);
assert.deepEqual(
  plain(
    logic.contextMenuActionRoute({
      command: logic.taskActivityToggleCommand(["work"], "chat"),
    }),
  ),
  {
    command: {
      arguments: [["work", "chat"]],
      kind: "task-model-request",
      requestMethod: "requestActivities",
    },
    kind: "task-model-request",
    update: null,
  },
);
assert.deepEqual(plain(logic.contextMenuActionRoute(null)), {
  command: null,
  kind: "none",
  update: null,
});
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
assert.equal(
  logic.newInstanceAction({
    canLaunchNewInstance: true,
    hasTask: true,
    isLauncher: false,
  }).icon,
  "window-new",
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
assert.equal(
  logic.basicMoveAction({
    capable: true,
    hasWindowTask: true,
    isWindow: true,
  }).icon,
  "transform-move",
);
assert.equal(
  logic.basicResizeAction({
    capable: true,
    hasWindowTask: true,
    isWindow: true,
  }).icon,
  "transform-scale",
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
assert.deepEqual(
  plain(
    logic.basicActionsSection({
      canLaunchNewInstance: true,
      hasTask: true,
      hasWindowTask: true,
      isLauncher: false,
      isMovable: true,
      isResizable: true,
      isWindow: true,
      launcherActivitiesVisible: false,
    }),
  ),
  {
    move: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestMove",
      },
      enabled: true,
      text: "Move",
      visible: true,
    },
    newInstance: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestNewInstance",
      },
      enabled: true,
      text: "New Instance",
      visible: true,
    },
    resize: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestResize",
      },
      enabled: true,
      text: "Resize",
      visible: true,
    },
    separator: {
      visible: true,
    },
  },
);
assert.deepEqual(
  plain(
    logic.basicActionsSection({
      canLaunchNewInstance: false,
      hasTask: false,
      hasWindowTask: false,
      isLauncher: false,
      isMovable: false,
      isResizable: false,
      isWindow: false,
      launcherActivitiesVisible: false,
    }),
  ),
  {
    move: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestMove",
      },
      enabled: false,
      text: "Move",
      visible: false,
    },
    newInstance: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestNewInstance",
      },
      enabled: false,
      text: "New Instance",
      visible: false,
    },
    resize: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestResize",
      },
      enabled: false,
      text: "Resize",
      visible: false,
    },
    separator: {
      visible: false,
    },
  },
);
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
assert.equal(
  logic.minimizeAction({
    capable: true,
    checked: false,
    hasWindowTask: true,
    isWindow: true,
  }).icon,
  "window-minimize",
);
assert.equal(
  logic.maximizeAction({
    capable: true,
    checked: false,
    hasWindowTask: true,
    isWindow: true,
  }).icon,
  "window-maximize",
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
assert.deepEqual(
  plain(
    logic.minimizeMaximizeActionsSection({
      hasWindowTask: true,
      isMaximizable: false,
      isMaximized: true,
      isMinimizable: true,
      isMinimized: true,
      isWindow: true,
    }),
  ),
  {
    maximize: {
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
    minimize: {
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
assert.deepEqual(
  plain(
    logic.keepAboveBelowActionsSection({
      hasWindowTask: false,
      isKeepAbove: true,
      isKeepBelow: false,
      isWindow: true,
    }),
  ),
  {
    keepAbove: {
      checked: true,
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestToggleKeepAbove",
      },
      enabled: false,
      text: "Keep Above Others",
      visible: true,
    },
    keepBelow: {
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
assert.deepEqual(
  plain(
    logic.fullscreenShadeBorderActionsSection({
      canSetNoBorder: true,
      fullScreenable: true,
      hasNoBorder: false,
      hasWindowTask: false,
      isFullScreen: true,
      isShadeable: false,
      isShaded: true,
      isWindow: true,
    }),
  ),
  {
    fullscreen: {
      checked: true,
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestToggleFullScreen",
      },
      enabled: false,
      text: "Fullscreen",
      visible: true,
    },
    noBorder: {
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
    shade: {
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
    logic.captureActionsSection({
      hasWindowTask: false,
      isExcludedFromCapture: true,
      isWindow: true,
    }),
  ),
  {
    excludeFromCapture: {
      checked: true,
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestToggleExcludeFromCapture",
      },
      enabled: false,
      text: "Hide from Screencasts",
      visible: true,
    },
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
assert.deepEqual(
  plain(
    logic.closeActionsSection({
      closable: true,
      hasTask: false,
      isWindow: true,
    }),
  ),
  {
    close: {
      command: {
        arguments: [],
        kind: "task-model-request",
        requestMethod: "requestClose",
      },
      enabled: false,
      text: "Close",
      visible: true,
    },
    separator: {
      visible: true,
    },
  },
);

{
  const menuSections = logic.contextMenuActionSections({
    activityEntryCount: 2,
    basicActionRoles: {
      canLaunchNewInstance: true,
      isLauncher: false,
      isMovable: true,
      isResizable: false,
    },
    captureCloseRoles: {
      closable: true,
      isExcludedFromCapture: false,
    },
    currentActivity: "activity-a",
    fullscreenShadeBorderRoles: {
      canSetNoBorder: true,
      fullScreenable: true,
      hasNoBorder: false,
      isFullScreen: true,
      isShadeable: false,
      isShaded: true,
    },
    hasTask: true,
    hasTaskModel: true,
    hasWindowTask: true,
    isWindow: true,
    keepAboveBelowRoles: {
      isKeepAbove: true,
      isKeepBelow: false,
    },
    launcherActivities: [],
    launcherList: ["app.desktop"],
    launcherPosition: 0,
    minimizeMaximizeRoles: {
      isMaximizable: true,
      isMaximized: false,
      isMinimizable: true,
      isMinimized: true,
    },
    pinState: {
      canPin: true,
      isPinned: true,
      launcherUrl: "app.desktop",
      pinnedLauncherPosition: 0,
    },
    taskRoles: {
      activities: [],
      virtualDesktops: ["desktop-a"],
    },
    virtualDesktopRoles: {
      isOnAllVirtualDesktops: false,
      isVirtualDesktopsChangeable: true,
    },
  });

  assert.deepEqual(
    plain({
      basic: menuSections.basicActions,
      capture: menuSections.captureActions,
      close: menuSections.closeActions,
      fullscreenShadeBorder: menuSections.fullscreenShadeBorderActions,
      keepAboveBelow: menuSections.keepAboveBelowActions,
      launcherActivity: {
        activityAction: menuSections.launcherActivityActions.activityAction({
          id: "activity-b",
          name: "Activity B",
        }),
        allLauncherActivities:
          menuSections.launcherActivityActions.allLauncherActivities,
        launcherActivities:
          menuSections.launcherActivityActions.launcherActivities,
      },
      minimizeMaximize: menuSections.minimizeMaximizeActions,
      pin: menuSections.pinActions,
      taskActivity: {
        activityAction: menuSections.taskActivityActions.activityAction({
          id: "activity-b",
          name: "Activity B",
        }),
        allTaskActivities: menuSections.taskActivityActions.allTaskActivities,
        taskActivities: menuSections.taskActivityActions.taskActivities,
      },
      virtualDesktop: {
        allVirtualDesktops:
          menuSections.virtualDesktopActions.allVirtualDesktops,
        desktopAction: menuSections.virtualDesktopActions.desktopAction({
          id: "desktop-b",
          name: "Desktop B",
        }),
        newVirtualDesktop: menuSections.virtualDesktopActions.newVirtualDesktop,
        virtualDesktops: menuSections.virtualDesktopActions.virtualDesktops,
      },
    }),
    {
      basic: {
        move: {
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestMove",
          },
          enabled: true,
          text: "Move",
          visible: true,
        },
        newInstance: {
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestNewInstance",
          },
          enabled: true,
          text: "New Instance",
          visible: true,
        },
        resize: {
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestResize",
          },
          enabled: false,
          text: "Resize",
          visible: false,
        },
        separator: {
          visible: true,
        },
      },
      capture: {
        excludeFromCapture: {
          checked: false,
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestToggleExcludeFromCapture",
          },
          enabled: true,
          text: "Hide from Screencasts",
          visible: true,
        },
      },
      close: {
        close: {
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestClose",
          },
          enabled: true,
          text: "Close",
          visible: true,
        },
        separator: {
          visible: true,
        },
      },
      fullscreenShadeBorder: {
        fullscreen: {
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
        noBorder: {
          checked: false,
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestToggleNoBorder",
          },
          enabled: true,
          text: "No Border",
          visible: true,
        },
        shade: {
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
      },
      keepAboveBelow: {
        keepAbove: {
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
        keepBelow: {
          checked: false,
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestToggleKeepBelow",
          },
          enabled: true,
          text: "Keep Below Others",
          visible: true,
        },
      },
      launcherActivity: {
        activityAction: {
          checked: true,
          text: "Activity B",
          update: {
            activities: ["activity-b"],
            changed: true,
            command: {
              action: "replaceLauncherList",
              kind: "launcher-command",
              launcherUrl: "",
              launchers: ["[activity-b]\napp.desktop"],
            },
            launchers: ["[activity-b]\napp.desktop"],
            ok: true,
            reason: "updated",
          },
        },
        allLauncherActivities: {
          checked: true,
          text: "All Activities",
          update: {
            activities: ["activity-a"],
            changed: true,
            command: {
              action: "replaceLauncherList",
              kind: "launcher-command",
              launcherUrl: "",
              launchers: ["[activity-a]\napp.desktop"],
            },
            launchers: ["[activity-a]\napp.desktop"],
            ok: true,
            reason: "updated",
          },
        },
        launcherActivities: {
          enabled: true,
          text: "Launcher Activities",
          visible: true,
        },
      },
      minimizeMaximize: {
        maximize: {
          checked: false,
          command: {
            arguments: [],
            kind: "task-model-request",
            requestMethod: "requestToggleMaximized",
          },
          enabled: true,
          text: "Maximize",
          visible: true,
        },
        minimize: {
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
      },
      pin: {
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
      taskActivity: {
        activityAction: {
          checked: true,
          command: {
            arguments: [["activity-b"]],
            kind: "task-model-request",
            requestMethod: "requestActivities",
          },
          text: "Activity B",
        },
        allTaskActivities: {
          checked: true,
          command: {
            arguments: [[]],
            kind: "task-model-request",
            requestMethod: "requestActivities",
          },
          text: "All Activities",
        },
        taskActivities: {
          enabled: true,
          text: "Activities",
          visible: true,
        },
      },
      virtualDesktop: {
        allVirtualDesktops: {
          checked: false,
          command: {
            arguments: [[]],
            kind: "task-model-request",
            requestMethod: "requestVirtualDesktops",
          },
          text: "All Desktops",
        },
        desktopAction: {
          checked: false,
          command: {
            arguments: [["desktop-b"]],
            kind: "task-model-request",
            requestMethod: "requestVirtualDesktops",
          },
          text: "Desktop B",
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
        virtualDesktops: {
          enabled: true,
          text: "Move to Desktop",
          visible: true,
        },
      },
    },
  );
}
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
    text: "Move to Desktop",
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
{
  const virtualDesktopSection = logic.virtualDesktopActionsSection({
    changeable: true,
    hasWindowTask: false,
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
        id: "desktop-b",
        name: "Desktop B",
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
        enabled: false,
        text: "New Desktop",
      },
      virtualDesktop: {
        checked: false,
        command: {
          arguments: [["desktop-b"]],
          kind: "task-model-request",
          requestMethod: "requestVirtualDesktops",
        },
        text: "Desktop B",
      },
      virtualDesktops: {
        enabled: false,
        text: "Move to Desktop",
        visible: true,
      },
    },
  );
}
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
{
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
}
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
  rolePort: {
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
assert.deepEqual(
  plain(
    logic.contextMenuRoleSnapshots(roleSource, roles, {
      activities: ["fallback-activity"],
      canLaunchNewInstance: false,
      canSetNoBorder: false,
      closable: false,
      fullScreenable: true,
      hasNoBorder: true,
      isExcludedFromCapture: true,
      isFullScreen: false,
      isKeepAbove: false,
      isKeepBelow: true,
      isLauncher: false,
      isMaximizable: false,
      isMaximized: true,
      isMinimizable: true,
      isMinimized: false,
      isMovable: true,
      isResizable: false,
      isShadeable: false,
      isShaded: true,
      isVirtualDesktopsChangeable: true,
      isWindow: false,
      launcherUrl: "fallback.desktop",
      virtualDesktops: ["fallback-desktop"],
    }),
  ),
  {
    basicActionRoles: {
      canLaunchNewInstance: true,
      isLauncher: true,
      isMovable: false,
      isResizable: true,
    },
    captureCloseRoles: {
      closable: true,
      isExcludedFromCapture: false,
    },
    fullscreenShadeBorderRoles: {
      canSetNoBorder: true,
      fullScreenable: false,
      hasNoBorder: false,
      isFullScreen: true,
      isShadeable: true,
      isShaded: false,
    },
    keepAboveBelowRoles: {
      isKeepAbove: true,
      isKeepBelow: false,
    },
    minimizeMaximizeRoles: {
      isMaximizable: true,
      isMaximized: false,
      isMinimizable: false,
      isMinimized: true,
    },
    taskRoles: {
      activities: ["live-activity"],
      isLauncher: true,
      isWindow: true,
      launcherUrl: "launcher-without-icon.desktop",
      virtualDesktops: ["live-desktop"],
    },
    virtualDesktopRoles: {
      isOnAllVirtualDesktops: true,
      isVirtualDesktopsChangeable: false,
    },
  },
);
assert.deepEqual(plain(roleCalls.map((call) => call.role).slice(0, 2)), [
  "LauncherUrl",
  "Missing",
]);
