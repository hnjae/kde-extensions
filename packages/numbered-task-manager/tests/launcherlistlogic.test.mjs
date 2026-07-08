// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherListLogic.mjs", import.meta.url),
  [
    "canMovePinnedLauncher",
    "launcherListsEqual",
    "movePinnedLauncher",
    "normalizedLauncherList",
    "pinnedLauncherGlobalPosition",
  ],
);

const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(helpers.normalizedLauncherList(null)), []);
assert.deepEqual(
  plain(helpers.normalizedLauncherList(["", "app.desktop", null])),
  ["app.desktop"],
);
assert.equal(helpers.launcherListsEqual(["a", "", "b"], ["a", "b"]), true);
assert.equal(helpers.launcherListsEqual(["a", "b"], ["b", "a"]), false);

const visibleLaunchers = ["app-a.desktop", "app-b.desktop", "app-c.desktop"];
const launcherPosition = (launcherUrl) =>
  ({
    "app-a.desktop": 0,
    "app-b.desktop": 1,
    "app-c.desktop": 2,
  })[launcherUrl] ?? -1;

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
    launchers: ["app-b.desktop", "app-c.desktop", "app-a.desktop"],
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
