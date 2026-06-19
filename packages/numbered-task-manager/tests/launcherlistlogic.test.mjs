// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherListLogic.mjs", import.meta.url),
  [
    "canMovePinnedLauncher",
    "launcherListsEqual",
    "launcherPinState",
    "movePinnedLauncher",
    "normalizedLauncherList",
    "pinnedLauncherGlobalPosition",
    "visibleLauncherPosition",
  ],
);

const plain = (value) => JSON.parse(JSON.stringify(value));
const launcherListLogicSource = readFileSync(
  new URL("../package/contents/ui/LauncherListLogic.mjs", import.meta.url),
  "utf8",
);

assert.deepEqual(plain(helpers.normalizedLauncherList(null)), []);
assert.deepEqual(
  plain(helpers.normalizedLauncherList(["", "app.desktop", null])),
  ["app.desktop"],
);
assert.equal(helpers.launcherListsEqual(["a", "", "b"], ["a", "b"]), true);
assert.equal(helpers.launcherListsEqual(["a", "b"], ["b", "a"]), false);
assert.doesNotMatch(
  launcherListLogicSource,
  /export function launcherConfigUpdate\b/,
);
assert.doesNotMatch(
  launcherListLogicSource,
  /export function launcherModelUpdate\b/,
);
assert.doesNotMatch(
  launcherListLogicSource,
  /export function launcherReconciliationDecision\b/,
);
assert.doesNotMatch(
  launcherListLogicSource,
  /export function runLauncherListUpdateTransaction\b/,
);
assert.doesNotMatch(
  launcherListLogicSource,
  /syncResult\.code\s*!==\s*"write-mismatch"/,
);

assert.deepEqual(
  plain(
    helpers.launcherPinState(["app.desktop"], "app.desktop", "work", () => 0),
  ),
  {
    canPin: true,
    isPinned: true,
    launcherUrl: "app.desktop",
    pinnedLauncherPosition: 0,
  },
);
assert.deepEqual(
  plain(helpers.launcherPinState([], "app.desktop", "work", () => -1)),
  {
    canPin: true,
    isPinned: false,
    launcherUrl: "app.desktop",
    pinnedLauncherPosition: -1,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherPinState(
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
  plain(helpers.launcherPinState(["app.desktop"], "", "work", () => 0)),
  {
    canPin: false,
    isPinned: false,
    launcherUrl: "",
    pinnedLauncherPosition: -1,
  },
);

assert.doesNotMatch(launcherListLogicSource, /function stringListContains\b/);
assert.doesNotMatch(launcherListLogicSource, /function uniqueStringList\b/);
assert.doesNotMatch(launcherListLogicSource, /function activitiesAreAll\b/);
assert.doesNotMatch(
  launcherListLogicSource,
  /function normalizedActivityList\b/,
);
assert.doesNotMatch(launcherListLogicSource, /function isInCurrentActivity\b/);
assert.doesNotMatch(launcherListLogicSource, /ActivityScopeLogic/);
assert.doesNotMatch(
  launcherListLogicSource,
  /function parseSerializedLauncher\b/,
);
assert.doesNotMatch(
  launcherListLogicSource,
  /function launcherActivityUpdate\b/,
);

const visibleLaunchers = [
  "[work]\napp-a.desktop",
  "[chat]\napp-b.desktop",
  "app-c.desktop",
];
const launcherPosition = (launcherUrl) =>
  ({
    "app-a.desktop": 0,
    "app-b.desktop": 1,
    "app-c.desktop": 2,
  })[launcherUrl] ?? -1;

assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-a.desktop",
    "work",
    launcherPosition,
  ),
  0,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-b.desktop",
    "work",
    launcherPosition,
  ),
  -1,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "app-c.desktop",
    "work",
    launcherPosition,
  ),
  1,
);
assert.equal(
  helpers.visibleLauncherPosition(
    visibleLaunchers,
    "missing.desktop",
    "work",
    -1,
  ),
  -1,
);

const pinnedA = {
  launcherUrl: "app-a.desktop",
  pinnedLauncherUrl: "app-a.desktop",
};
const pinnedB = {
  launcherUrl: "app-b.desktop",
  pinnedLauncherUrl: "app-b.desktop",
};
const pinnedC = {
  launcherUrl: "app-c.desktop",
  pinnedLauncherUrl: "app-c.desktop",
};

assert.equal(
  helpers.pinnedLauncherGlobalPosition(visibleLaunchers, pinnedB, () => -1),
  1,
);
assert.equal(
  helpers.pinnedLauncherGlobalPosition(visibleLaunchers, {}, launcherPosition),
  -1,
);
assert.equal(
  helpers.canMovePinnedLauncher(
    visibleLaunchers,
    pinnedA,
    pinnedB,
    launcherPosition,
  ),
  true,
);
assert.equal(
  helpers.canMovePinnedLauncher(
    visibleLaunchers,
    pinnedA,
    pinnedA,
    launcherPosition,
  ),
  false,
);

assert.deepEqual(
  plain(
    helpers.movePinnedLauncher(
      visibleLaunchers,
      pinnedA,
      pinnedC,
      launcherPosition,
    ),
  ),
  {
    moved: true,
    launchers: [
      "[chat]\napp-b.desktop",
      "app-c.desktop",
      "[work]\napp-a.desktop",
    ],
  },
);
assert.deepEqual(
  plain(
    helpers.movePinnedLauncher(
      visibleLaunchers,
      pinnedA,
      pinnedA,
      launcherPosition,
    ),
  ),
  {
    moved: false,
    launchers: visibleLaunchers,
  },
);
