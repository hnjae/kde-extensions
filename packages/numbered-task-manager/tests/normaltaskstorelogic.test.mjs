// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/NormalTaskStoreLogic.js", import.meta.url),
  [
    "allocateNormalTaskPublication",
    "createNormalTaskPublicationKey",
    "createNormalTaskStore",
    "publishNormalTask",
    "recomputeNormalTaskStore",
    "removeNormalTask",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

const launcherA = {
  entryKey: "launcherA",
  isLauncher: true,
  launcherPosition: 0,
  launcherUrl: "appA.desktop",
  sourceIndex: 10,
  title: "A Launcher",
};
const windowA = {
  entryKey: "windowA",
  isLauncher: false,
  launcherPosition: 0,
  launcherUrl: "appA.desktop",
  sourceIndex: 4,
  title: "A Window",
};
const windowC = {
  entryKey: "windowC",
  isLauncher: false,
  launcherPosition: -1,
  launcherUrl: "appC.desktop",
  sourceIndex: 8,
  title: "C Window",
};
const windowD = {
  entryKey: "windowD",
  isLauncher: false,
  launcherPosition: -1,
  launcherUrl: "appD.desktop",
  sourceIndex: 6,
  title: "D Window",
};
const visibleLauncherPosition = (launcherUrl) =>
  launcherUrl === "appA.desktop" ? 0 : -1;

assert.deepEqual(plain(logic.createNormalTaskStore()), {
  entries: [],
  entryMap: {},
  manualOrder: [],
  nextPublicationId: 0,
});
assert.deepEqual(plain(logic.createNormalTaskPublicationKey(0)), {
  key: "normal:1",
  nextPublicationId: 1,
});
assert.deepEqual(plain(logic.createNormalTaskPublicationKey(41)), {
  key: "normal:42",
  nextPublicationId: 42,
});

const initial = logic.createNormalTaskStore();
const firstPublication = logic.allocateNormalTaskPublication(initial);
assert.deepEqual(plain(firstPublication), {
  key: "normal:1",
  store: {
    entries: [],
    entryMap: {},
    manualOrder: [],
    nextPublicationId: 1,
  },
});
assert.deepEqual(plain(initial), {
  entries: [],
  entryMap: {},
  manualOrder: [],
  nextPublicationId: 0,
});
assert.deepEqual(
  plain(logic.allocateNormalTaskPublication(firstPublication.store)),
  {
    key: "normal:2",
    store: {
      entries: [],
      entryMap: {},
      manualOrder: [],
      nextPublicationId: 2,
    },
  },
);

const launcherStore = logic.publishNormalTask(
  initial,
  "launcherA",
  true,
  launcherA,
  visibleLauncherPosition,
);
assert.deepEqual(plain(initial), {
  entries: [],
  entryMap: {},
  manualOrder: [],
  nextPublicationId: 0,
});
assert.deepEqual(plain(Object.keys(launcherStore.entryMap)), ["launcherA"]);
assert.deepEqual(plain(launcherStore.entries.map((entry) => entry.entryKey)), [
  "launcherA",
]);
assert.equal(launcherStore.entries[0].launcherBacked, true);
assert.equal(launcherStore.entries[0].moveIndex, 10);

const pinnedWindowStore = logic.publishNormalTask(
  launcherStore,
  "windowA",
  true,
  windowA,
  visibleLauncherPosition,
);
assert.deepEqual(plain(Object.keys(pinnedWindowStore.entryMap).sort()), [
  "launcherA",
  "windowA",
]);
assert.deepEqual(
  plain(pinnedWindowStore.entries.map((entry) => entry.entryKey)),
  ["windowA"],
);
assert.equal(pinnedWindowStore.entries[0].launcherBacked, true);
assert.equal(pinnedWindowStore.entries[0].moveIndex, 10);

const populatedStore = logic.recomputeNormalTaskStore(
  {
    entryMap: {
      launcherA,
      windowA,
      windowC,
      windowD,
    },
    manualOrder: ["windowC", "stale", "windowD"],
  },
  visibleLauncherPosition,
);
assert.deepEqual(plain(populatedStore.manualOrder), ["windowC", "windowD"]);
assert.deepEqual(plain(populatedStore.entries.map((entry) => entry.entryKey)), [
  "windowA",
  "windowC",
  "windowD",
]);

const withoutWindowC = logic.removeNormalTask(
  populatedStore,
  "windowC",
  visibleLauncherPosition,
);
assert.deepEqual(plain(Object.keys(withoutWindowC.entryMap).sort()), [
  "launcherA",
  "windowA",
  "windowD",
]);
assert.deepEqual(plain(withoutWindowC.manualOrder), ["windowD"]);
assert.deepEqual(plain(withoutWindowC.entries.map((entry) => entry.entryKey)), [
  "windowA",
  "windowD",
]);

const missingRemove = logic.removeNormalTask(
  withoutWindowC,
  "not-present",
  visibleLauncherPosition,
);
assert.deepEqual(plain(missingRemove), plain(withoutWindowC));

const unqualifiedPublishRemoves = logic.publishNormalTask(
  withoutWindowC,
  "windowD",
  false,
  windowD,
  visibleLauncherPosition,
);
assert.deepEqual(
  plain(Object.keys(unqualifiedPublishRemoves.entryMap).sort()),
  ["launcherA", "windowA"],
);
assert.deepEqual(plain(unqualifiedPublishRemoves.manualOrder), []);
assert.deepEqual(
  plain(unqualifiedPublishRemoves.entries.map((entry) => entry.entryKey)),
  ["windowA"],
);
