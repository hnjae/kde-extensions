// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const exportNames = ["contextMenuActionSections"];

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuActionSectionsLogic.mjs",
    import.meta.url,
  ),
  exportNames,
);
const facade = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.mjs", import.meta.url),
  exportNames,
);

const plain = (value) => JSON.parse(JSON.stringify(value));

const menuState = {
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
};

function sectionSnapshot(menuSections) {
  return plain({
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
    moreActions: menuSections.moreActions,
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
      allVirtualDesktops: menuSections.virtualDesktopActions.allVirtualDesktops,
      desktopAction: menuSections.virtualDesktopActions.desktopAction({
        id: "desktop-b",
        name: "Desktop B",
      }),
      newVirtualDesktop: menuSections.virtualDesktopActions.newVirtualDesktop,
      virtualDesktops: menuSections.virtualDesktopActions.virtualDesktops,
    },
  });
}

const menuSections = logic.contextMenuActionSections(menuState);

assert.deepEqual(
  sectionSnapshot(menuSections),
  sectionSnapshot(facade.contextMenuActionSections(menuState)),
);
assert.equal(Object.keys(menuSections).includes("moreActions"), false);
assert.equal(Object.hasOwn(menuSections, "moreActions"), true);
assert.deepEqual(sectionSnapshot(menuSections), {
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
  moreActions: {
    moreActions: {
      text: "More",
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
});
