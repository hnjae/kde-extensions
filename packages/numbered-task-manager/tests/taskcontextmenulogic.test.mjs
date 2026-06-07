// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.js", import.meta.url),
  [
    "boolRoleData",
    "checkableWindowActionState",
    "checkableWindowCapabilityActionState",
    "closeActionState",
    "menuActionSectionVisible",
    "newVirtualDesktopActionState",
    "launcherActivityListSnapshot",
    "launcherActivityMenuState",
    "launcherActivitiesVisible",
    "newInstanceActionState",
    "panelMenuPlacement",
    "pinActionState",
    "roleData",
    "taskActivityMenuState",
    "taskRoleSnapshot",
    "taskActivitiesActionState",
    "virtualDesktopMenuState",
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
assert.deepEqual(plain(logic.virtualDesktopMenuState([], true, "desktop-a")), {
  allDesktopsChecked: true,
  desktopChecked: true,
});
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
  IsLauncher: 1,
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
  IsLauncher: "IsLauncher",
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
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityListSnapshot"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.launcherActivityMenuState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivityMenuState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopMenuState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.newInstanceActionState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.windowCapabilityActionState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.checkableWindowCapabilityActionState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.checkableWindowActionState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.virtualDesktopsActionState"),
  true,
);
assert.equal(
  menuQml.includes("TaskContextMenuLogic.taskActivitiesActionState"),
  true,
);
assert.equal(menuQml.includes("TaskContextMenuLogic.closeActionState"), true);
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
assert.equal(menuQml.includes("TaskActionLogic.contextMenuTaskCommand"), true);
assert.equal(
  menuQml.includes("TaskActionLogic.contextMenuLauncherCommand"),
  true,
);
assert.equal(menuQml.includes("function requestTaskModelAction"), false);
assert.equal(menuQml.includes("signal pinRequested"), false);
assert.equal(menuQml.includes("signal unpinRequested"), false);
assert.equal(menuQml.includes("signal launcherListChangeRequested"), false);
assert.equal(/\b(?:root\.)?taskModel\.request[A-Z]/.test(menuQml), false);

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
