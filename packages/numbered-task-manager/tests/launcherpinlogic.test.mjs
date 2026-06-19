// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherPinLogic.mjs", import.meta.url),
  ["launcherPinState", "launcherPositionForUrl", "visibleLauncherPosition"],
);

const plain = (value) => JSON.parse(JSON.stringify(value));
const launcherListLogicSource = readFileSync(
  new URL("../package/contents/ui/LauncherListLogic.mjs", import.meta.url),
  "utf8",
);

assert.equal(
  helpers.launcherPositionForUrl("", () => 0),
  -1,
);
assert.equal(
  helpers.launcherPositionForUrl("app.desktop", () => 2),
  2,
);
assert.equal(helpers.launcherPositionForUrl("app.desktop", "bad"), -1);
assert.equal(helpers.launcherPositionForUrl("app.desktop", null), -1);

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

assert.doesNotMatch(launcherListLogicSource, /function launcherPinState\b/);
assert.doesNotMatch(
  launcherListLogicSource,
  /function visibleLauncherPosition\b/,
);
