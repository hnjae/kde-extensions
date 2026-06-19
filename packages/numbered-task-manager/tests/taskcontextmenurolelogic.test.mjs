// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
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

const plain = (value) => JSON.parse(JSON.stringify(value));

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
