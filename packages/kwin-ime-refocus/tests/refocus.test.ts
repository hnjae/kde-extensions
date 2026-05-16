// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createContext, runInContext } from "node:vm";

interface DesktopFixture {
  readonly id: string;
}

interface WindowFixture {
  readonly active: boolean;
  deleted: boolean;
  readonly desktops: readonly DesktopFixture[];
  hidden: boolean;
  inputMethod: boolean;
  managed: boolean;
  readonly normalWindow: boolean;
  onAllDesktops: boolean;
  specialWindow: boolean;
  wantsInput: boolean;
  minimized: boolean;
}

interface WorkspaceFixture {
  activeWindow: WindowFixture | null;
  currentDesktop: DesktopFixture | null;
  readonly assignments: readonly (WindowFixture | null)[];
}

interface RefocusApi {
  canRefocusWindow(
    window: WindowFixture | null,
    desktop: DesktopFixture | null,
  ): boolean;
  recoverImeFocus(workspace: WorkspaceFixture): void;
}

async function loadRefocusApi(): Promise<RefocusApi> {
  const refocusScript = await readFile(
    new URL("../build/src/refocus.js", import.meta.url),
    "utf8",
  );
  const sandbox: { KWinImeRefocus?: RefocusApi } = {};

  createContext(sandbox);
  runInContext(refocusScript, sandbox);

  const api = sandbox.KWinImeRefocus;
  if (api === undefined) {
    throw new Error("refocus API was not loaded");
  }

  return api;
}

function createWindow(
  desktop: DesktopFixture,
  overrides: Partial<WindowFixture> = {},
): WindowFixture {
  return {
    active: true,
    deleted: false,
    desktops: [desktop],
    hidden: false,
    inputMethod: false,
    managed: true,
    minimized: false,
    normalWindow: true,
    onAllDesktops: false,
    specialWindow: false,
    wantsInput: true,
    ...overrides,
  };
}

function createWorkspace(
  activeWindow: WindowFixture | null,
  currentDesktop: DesktopFixture | null,
  onActiveWindowSet: (
    value: WindowFixture | null,
    workspace: WorkspaceFixture,
  ) => void = () => {},
): WorkspaceFixture {
  const assignments: (WindowFixture | null)[] = [];
  let storedActiveWindow = activeWindow;
  let workspace: WorkspaceFixture;

  workspace = {
    get activeWindow() {
      return storedActiveWindow;
    },
    set activeWindow(value: WindowFixture | null) {
      assignments.push(value);
      storedActiveWindow = value;
      onActiveWindowSet(value, workspace);
    },
    currentDesktop,
    assignments,
  };

  return workspace;
}

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
