// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/VirtualDesktopLogic.mjs", import.meta.url),
  [
    "desktopId",
    "desktopListContains",
    "isOnCurrentVirtualDesktop",
    "isRemoteVirtualDesktop",
    "virtualDesktopMenuState",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(logic.desktopId(null), "");
assert.equal(logic.desktopId("desktop-a"), "desktop-a");
assert.equal(logic.desktopId({ id: "desktop-b" }), "desktop-b");
assert.equal(logic.desktopId(42), "42");

assert.equal(
  logic.desktopListContains(["desktop-a"], { id: "desktop-a" }),
  true,
);
assert.equal(logic.desktopListContains(["desktop-a"], "desktop-b"), false);
assert.equal(logic.desktopListContains(null, "desktop-a"), false);
assert.equal(logic.desktopListContains(["desktop-a"], null), false);

assert.equal(logic.isOnCurrentVirtualDesktop([], true, "desktop-a"), true);
assert.equal(
  logic.isOnCurrentVirtualDesktop(["desktop-a"], false, "desktop-a"),
  true,
);
assert.equal(
  logic.isOnCurrentVirtualDesktop(["desktop-b"], false, "desktop-a"),
  false,
);

assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-b"], false, "desktop-a"),
  true,
);
assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-a"], false, "desktop-a"),
  false,
);
assert.equal(
  logic.isRemoteVirtualDesktop(["desktop-b"], true, "desktop-a"),
  false,
);
assert.equal(logic.isRemoteVirtualDesktop([], false, "desktop-a"), false);

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
