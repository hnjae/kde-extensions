// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const helpers = loadQmlJsModule(
  new URL("../package/contents/ui/LauncherListLogic.js", import.meta.url),
  [
    "canMovePinnedLauncher",
    "effectiveSerializedLauncherActivities",
    "createLauncherReconciliationState",
    "launcherActivityUpdate",
    "launcherActivitiesAfterAllToggle",
    "launcherActivitiesAfterToggle",
    "launcherConfigConvergence",
    "launcherConfigUpdate",
    "launcherListWithActivitiesAt",
    "launcherListsEqual",
    "launcherModelConvergence",
    "launcherModelUpdate",
    "launcherReconciliationAfterResult",
    "launcherReconciliationDecision",
    "launcherPinState",
    "movePinnedLauncher",
    "normalizedLauncherList",
    "parseSerializedLauncher",
    "pinnedLauncherGlobalPosition",
    "runLauncherListUpdateTransaction",
    "serializeLauncherWithActivities",
    "serializedLauncherVisibleInActivity",
    "visibleLauncherPosition",
  ],
);

const nullActivityId = "00000000-0000-0000-0000-000000000000";
const plain = (value) => JSON.parse(JSON.stringify(value));
const launcherListLogicSource = readFileSync(
  new URL("../package/contents/ui/LauncherListLogic.js", import.meta.url),
  "utf8",
);

assert.deepEqual(plain(helpers.normalizedLauncherList(null)), []);
assert.deepEqual(
  plain(helpers.normalizedLauncherList(["", "app.desktop", null])),
  ["app.desktop"],
);
assert.equal(helpers.launcherListsEqual(["a", "", "b"], ["a", "b"]), true);
assert.equal(helpers.launcherListsEqual(["a", "b"], ["b", "a"]), false);
assert.deepEqual(
  plain(helpers.launcherConfigUpdate(["a.desktop"], ["", "a.desktop"])),
  {
    changed: false,
    launchers: ["a.desktop"],
  },
);
assert.deepEqual(
  plain(helpers.launcherConfigUpdate(["a.desktop"], ["b.desktop"])),
  {
    changed: true,
    launchers: ["b.desktop"],
  },
);
assert.deepEqual(
  plain(
    helpers.launcherConfigConvergence(
      helpers.launcherConfigUpdate(["a.desktop"], ["a.desktop"]),
      ["a.desktop"],
    ),
  ),
  {
    changed: false,
    code: "unchanged",
    configConverged: true,
    configLaunchers: ["a.desktop"],
    failedTargets: [],
    launchers: ["a.desktop"],
    ok: true,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherConfigConvergence(
      helpers.launcherConfigUpdate(["a.desktop"], ["b.desktop"]),
      ["b.desktop"],
    ),
  ),
  {
    changed: true,
    code: "converged",
    configConverged: true,
    configLaunchers: ["b.desktop"],
    failedTargets: [],
    launchers: ["b.desktop"],
    ok: true,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherConfigConvergence(
      helpers.launcherConfigUpdate(["a.desktop"], ["b.desktop"]),
      ["a.desktop"],
    ),
  ),
  {
    changed: true,
    code: "write-mismatch",
    configConverged: false,
    configLaunchers: ["a.desktop"],
    failedTargets: ["config"],
    launchers: ["b.desktop"],
    ok: false,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherModelUpdate(
      ["a.desktop"],
      ["old.desktop"],
      ["", "a.desktop"],
    ),
  ),
  {
    changed: true,
    configChanged: true,
    launchers: ["a.desktop"],
    modelChanged: false,
  },
);
assert.deepEqual(
  plain(helpers.launcherModelUpdate(["a.desktop"], ["a.desktop"], [""])),
  {
    changed: true,
    configChanged: true,
    launchers: [],
    modelChanged: true,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherModelConvergence(
      helpers.launcherModelUpdate(
        ["a.desktop"],
        ["old.desktop"],
        ["b.desktop"],
      ),
      ["b.desktop"],
      ["b.desktop"],
    ),
  ),
  {
    changed: true,
    code: "converged",
    configConverged: true,
    configLaunchers: ["b.desktop"],
    failedTargets: [],
    launchers: ["b.desktop"],
    modelConverged: true,
    modelLaunchers: ["b.desktop"],
    ok: true,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherModelConvergence(
      helpers.launcherModelUpdate(
        ["a.desktop"],
        ["old.desktop"],
        ["b.desktop"],
      ),
      ["b.desktop"],
      ["old.desktop"],
    ),
  ),
  {
    changed: true,
    code: "write-mismatch",
    configConverged: false,
    configLaunchers: ["old.desktop"],
    failedTargets: ["config"],
    launchers: ["b.desktop"],
    modelConverged: true,
    modelLaunchers: ["b.desktop"],
    ok: false,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherModelConvergence(
      helpers.launcherModelUpdate(["a.desktop"], ["a.desktop"], ["a.desktop"]),
      ["a.desktop"],
      ["a.desktop"],
    ),
  ),
  {
    changed: false,
    code: "unchanged",
    configConverged: true,
    configLaunchers: ["a.desktop"],
    failedTargets: [],
    launchers: ["a.desktop"],
    modelConverged: true,
    modelLaunchers: ["a.desktop"],
    ok: true,
  },
);

assert.deepEqual(plain(helpers.createLauncherReconciliationState()), {
  attempts: 0,
  launchers: [],
  maxAttempts: 1,
  pending: false,
});

const pendingReconciliation = helpers.launcherReconciliationAfterResult(
  null,
  helpers.launcherModelConvergence(
    helpers.launcherModelUpdate(["a.desktop"], ["old.desktop"], ["b.desktop"]),
    ["a.desktop"],
    ["old.desktop"],
  ),
);
assert.deepEqual(plain(pendingReconciliation), {
  attempts: 0,
  launchers: ["b.desktop"],
  maxAttempts: 1,
  pending: true,
});
assert.deepEqual(
  plain(
    helpers.launcherReconciliationAfterResult(pendingReconciliation, {
      code: "converged",
      ok: true,
    }),
  ),
  {
    attempts: 0,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherReconciliationDecision(
      pendingReconciliation,
      ["b.desktop"],
      ["b.desktop"],
    ),
  ),
  {
    action: "clear",
    launchers: [],
    state: {
      attempts: 0,
      launchers: [],
      maxAttempts: 1,
      pending: false,
    },
  },
);
assert.deepEqual(
  plain(
    helpers.launcherReconciliationDecision(
      pendingReconciliation,
      ["a.desktop"],
      ["old.desktop"],
    ),
  ),
  {
    action: "retry",
    launchers: ["b.desktop"],
    state: {
      attempts: 1,
      launchers: ["b.desktop"],
      maxAttempts: 1,
      pending: true,
    },
  },
);
assert.deepEqual(
  plain(
    helpers.launcherReconciliationDecision(
      {
        attempts: 1,
        launchers: ["b.desktop"],
        maxAttempts: 1,
        pending: true,
      },
      ["a.desktop"],
      ["old.desktop"],
    ),
  ),
  {
    action: "expired",
    launchers: ["b.desktop"],
    state: {
      attempts: 1,
      launchers: [],
      maxAttempts: 1,
      pending: false,
    },
  },
);
assert.deepEqual(
  plain(
    helpers.launcherReconciliationAfterResult(
      {
        attempts: 1,
        launchers: ["b.desktop"],
        maxAttempts: 1,
        pending: true,
      },
      helpers.launcherModelConvergence(
        helpers.launcherModelUpdate(
          ["a.desktop"],
          ["old.desktop"],
          ["b.desktop"],
        ),
        ["a.desktop"],
        ["old.desktop"],
      ),
    ),
  ),
  {
    attempts: 1,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  },
);
assert.deepEqual(
  plain(
    helpers.launcherReconciliationAfterResult(
      null,
      helpers.launcherModelConvergence(
        helpers.launcherModelUpdate(["a.desktop"], ["a.desktop"], []),
        ["a.desktop"],
        ["a.desktop"],
      ),
    ),
  ),
  {
    attempts: 0,
    launchers: [],
    maxAttempts: 1,
    pending: true,
  },
);

const launcherUpdateState = { updatingLauncherConfig: false };
assert.deepEqual(
  plain(
    helpers.runLauncherListUpdateTransaction(launcherUpdateState, () => {
      assert.equal(launcherUpdateState.updatingLauncherConfig, true);
      return { code: "converged", ok: true };
    }),
  ),
  { code: "converged", ok: true },
);
assert.equal(launcherUpdateState.updatingLauncherConfig, false);

const failingLauncherUpdateState = { updatingLauncherConfig: false };
assert.deepEqual(
  plain(
    helpers.runLauncherListUpdateTransaction(failingLauncherUpdateState, () => {
      assert.equal(failingLauncherUpdateState.updatingLauncherConfig, true);
      throw new Error("assignment denied");
    }),
  ),
  {
    changed: false,
    code: "write-failed",
    error: "assignment denied",
    ok: false,
  },
);
assert.equal(failingLauncherUpdateState.updatingLauncherConfig, false);

assert.deepEqual(
  plain(helpers.parseSerializedLauncher("org.example.App.desktop")),
  {
    activities: [],
    url: "org.example.App.desktop",
  },
);
assert.deepEqual(
  plain(
    helpers.parseSerializedLauncher("[work,chat]\norg.example.App.desktop"),
  ),
  {
    activities: ["work", "chat"],
    url: "org.example.App.desktop",
  },
);
assert.deepEqual(
  plain(helpers.parseSerializedLauncher("[work]org.example.App.desktop")),
  {
    activities: [],
    url: "[work]org.example.App.desktop",
  },
);

assert.deepEqual(
  plain(helpers.effectiveSerializedLauncherActivities("[work]\napp.desktop")),
  ["work"],
);
assert.deepEqual(
  plain(helpers.effectiveSerializedLauncherActivities("app.desktop")),
  [nullActivityId],
);

assert.equal(
  helpers.serializedLauncherVisibleInActivity("[work]\napp.desktop", "work"),
  true,
);
assert.equal(
  helpers.serializedLauncherVisibleInActivity("[chat]\napp.desktop", "work"),
  false,
);

assert.equal(
  helpers.serializeLauncherWithActivities("[old]\napp.desktop", ["work"]),
  "[work]\napp.desktop",
);
assert.equal(
  helpers.serializeLauncherWithActivities("[old]\napp.desktop", [
    nullActivityId,
  ]),
  "app.desktop",
);
assert.deepEqual(
  plain(
    helpers.launcherListWithActivitiesAt(["one.desktop", "two.desktop"], 1, [
      "work",
    ]),
  ),
  ["one.desktop", "[work]\ntwo.desktop"],
);
assert.equal(
  helpers.launcherListWithActivitiesAt(["one.desktop"], 2, ["work"]),
  null,
);
assert.deepEqual(
  plain(
    helpers.launcherActivityUpdate(["one.desktop", "two.desktop"], 1, ["work"]),
  ),
  {
    activities: ["work"],
    changed: true,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "updated",
  },
);
assert.deepEqual(
  plain(
    helpers.launcherActivityUpdate(["one.desktop", "[work]\ntwo.desktop"], 1, [
      "work",
    ]),
  ),
  {
    activities: ["work"],
    changed: false,
    launchers: ["one.desktop", "[work]\ntwo.desktop"],
    ok: true,
    reason: "unchanged",
  },
);
assert.deepEqual(
  plain(helpers.launcherActivityUpdate(["one.desktop"], 3, ["work"])),
  {
    activities: [],
    changed: false,
    launchers: ["one.desktop"],
    ok: false,
    reason: "invalid-position",
  },
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

assert.deepEqual(
  plain(helpers.launcherActivitiesAfterAllToggle([nullActivityId], "work")),
  ["work"],
);
assert.equal(
  helpers.launcherActivitiesAfterAllToggle([nullActivityId], ""),
  null,
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterAllToggle(["work"], "work")),
  [nullActivityId],
);
assert.deepEqual(
  plain(
    helpers.launcherActivitiesAfterToggle([nullActivityId], "chat", "work"),
  ),
  ["chat"],
);
assert.deepEqual(
  plain(
    helpers.launcherActivitiesAfterToggle(["work", "chat"], "work", "work"),
  ),
  ["chat"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "work", "chat")),
  ["chat"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "work", "")),
  ["work"],
);
assert.deepEqual(
  plain(helpers.launcherActivitiesAfterToggle(["work"], "chat", "work")),
  ["work", "chat"],
);

assert.doesNotMatch(launcherListLogicSource, /function stringListContains\b/);
assert.doesNotMatch(launcherListLogicSource, /function uniqueStringList\b/);
assert.doesNotMatch(launcherListLogicSource, /function activitiesAreAll\b/);
assert.doesNotMatch(
  launcherListLogicSource,
  /function normalizedActivityList\b/,
);
assert.doesNotMatch(launcherListLogicSource, /function isInCurrentActivity\b/);
assert.match(
  launcherListLogicSource,
  /ActivityScopeLogic\.isInCurrentActivity/,
);
assert.match(launcherListLogicSource, /ActivityScopeLogic\.activitiesAreAll/);
assert.match(
  launcherListLogicSource,
  /ActivityScopeLogic\.normalizedActivityList/,
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
