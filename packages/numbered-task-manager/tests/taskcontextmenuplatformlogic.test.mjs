// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuPlatformLogic.mjs",
    import.meta.url,
  ),
  [
    "activityEntriesSnapshot",
    "panelMenuPlacement",
    "virtualDesktopEntriesSnapshot",
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

const taskContextMenuLogicSource = readFileSync(
  new URL("../package/contents/ui/TaskContextMenuLogic.mjs", import.meta.url),
  "utf8",
);
const menuQml = readFileSync(
  new URL("../package/contents/ui/TaskContextMenu.qml", import.meta.url),
  "utf8",
);
const platformStateQml = readFileSync(
  new URL(
    "../package/contents/ui/TaskContextMenuPlatformState.qml",
    import.meta.url,
  ),
  "utf8",
);

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

assert.doesNotMatch(
  taskContextMenuLogicSource,
  /function panelMenuPlacement\b/,
);
assert.doesNotMatch(
  taskContextMenuLogicSource,
  /function virtualDesktopEntriesSnapshot\b/,
);
assert.doesNotMatch(
  taskContextMenuLogicSource,
  /function activityEntriesSnapshot\b/,
);
assert.match(
  menuQml,
  /import "TaskContextMenuPlatformLogic\.mjs" as TaskContextMenuPlatformLogic/,
);
assert.match(
  menuQml,
  /placement: TaskContextMenuPlatformLogic\.panelMenuPlacement\(Plasmoid\.location, PlasmaCore\.Types, PlasmaExtras\.Menu\)/,
);
assert.match(
  platformStateQml,
  /import "TaskContextMenuPlatformLogic\.mjs" as TaskContextMenuPlatformLogic/,
);
assert.match(
  platformStateQml,
  /TaskContextMenuPlatformLogic\.virtualDesktopEntriesSnapshot\(virtualDesktopInfo\.desktopIds, virtualDesktopInfo\.desktopNames\)/,
);
assert.match(
  platformStateQml,
  /TaskContextMenuPlatformLogic\.activityEntriesSnapshot\(activityInfo\.runningActivities\(\), id => activityInfo\.activityName\(id\), id => activityInfo\.activityIcon\(id\)\)/,
);
