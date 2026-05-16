// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import test from "node:test";
import {
  createWindow,
  createWorkspace,
  loadRefocusApi,
} from "./support/refocus-harness.js";

test("recoverImeFocus clears focus and restores an eligible original window", async () => {
  const refocus = await loadRefocusApi();
  const desktop = { id: "desktop-1" };
  const originalWindow = createWindow(desktop);
  const workspace = createWorkspace(originalWindow, desktop);

  refocus.recoverImeFocus(workspace);

  assert.deepEqual(workspace.assignments, [null, originalWindow]);
  assert.equal(workspace.activeWindow, originalWindow);
});

test("recoverImeFocus does nothing when no window is focused", async () => {
  const refocus = await loadRefocusApi();
  const workspace = createWorkspace(null, { id: "desktop-1" });

  refocus.recoverImeFocus(workspace);

  assert.deepEqual(workspace.assignments, []);
  assert.equal(workspace.activeWindow, null);
});

test("recoverImeFocus does not restore after a desktop change", async () => {
  const refocus = await loadRefocusApi();
  const originalDesktop = { id: "desktop-1" };
  const nextDesktop = { id: "desktop-2" };
  const originalWindow = createWindow(originalDesktop);
  const workspace = createWorkspace(
    originalWindow,
    originalDesktop,
    (value, currentWorkspace) => {
      if (value === null) {
        currentWorkspace.currentDesktop = nextDesktop;
      }
    },
  );

  refocus.recoverImeFocus(workspace);

  assert.deepEqual(workspace.assignments, [null]);
  assert.equal(workspace.activeWindow, null);
});

test("recoverImeFocus does not restore when the original window becomes ineligible", async () => {
  const refocus = await loadRefocusApi();
  const desktop = { id: "desktop-1" };
  const originalWindow = createWindow(desktop);
  const workspace = createWorkspace(originalWindow, desktop, (value) => {
    if (value === null) {
      originalWindow.minimized = true;
    }
  });

  refocus.recoverImeFocus(workspace);

  assert.deepEqual(workspace.assignments, [null]);
  assert.equal(workspace.activeWindow, null);
});

test("canRefocusWindow rejects windows that should not receive recovered focus", async () => {
  const refocus = await loadRefocusApi();
  const desktop = { id: "desktop-1" };

  const ineligibleWindows = [
    createWindow(desktop, { deleted: true }),
    createWindow(desktop, { hidden: true }),
    createWindow(desktop, { inputMethod: true }),
    createWindow(desktop, { managed: false }),
    createWindow(desktop, { minimized: true }),
    createWindow(desktop, { specialWindow: true }),
    createWindow(desktop, { wantsInput: false }),
    createWindow({ id: "desktop-2" }),
  ];

  assert.equal(refocus.canRefocusWindow(null, desktop), false);
  assert.equal(refocus.canRefocusWindow(createWindow(desktop), null), false);

  for (const window of ineligibleWindows) {
    assert.equal(refocus.canRefocusWindow(window, desktop), false);
  }
});

test("canRefocusWindow accepts windows visible on the current desktop", async () => {
  const refocus = await loadRefocusApi();
  const desktop = { id: "desktop-1" };

  assert.equal(refocus.canRefocusWindow(createWindow(desktop), desktop), true);
  assert.equal(
    refocus.canRefocusWindow(
      createWindow({ id: "desktop-2" }, { onAllDesktops: true }),
      desktop,
    ),
    true,
  );
});
