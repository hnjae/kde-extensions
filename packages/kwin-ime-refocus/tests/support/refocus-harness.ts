// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";

export interface DesktopFixture {
  readonly id: string;
}

export interface WindowFixture {
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

export interface WorkspaceFixture {
  activeWindow: WindowFixture | null;
  currentDesktop: DesktopFixture | null;
  readonly assignments: readonly (WindowFixture | null)[];
}

export interface RefocusTargetFixture {
  readonly desktop: DesktopFixture;
  readonly window: WindowFixture;
}

export interface RefocusApi {
  createRefocusTarget(
    window: WindowFixture | null,
    desktop: DesktopFixture | null,
  ): RefocusTargetFixture | null;
  canRestoreRefocusTarget(
    target: RefocusTargetFixture,
    currentDesktop: DesktopFixture | null,
  ): boolean;
  isSameDesktop(
    left: DesktopFixture | null,
    right: DesktopFixture | null,
  ): boolean;
  isWindowOnDesktop(
    window: WindowFixture,
    desktop: DesktopFixture | null,
  ): boolean;
  canRefocusWindow(
    window: WindowFixture | null,
    desktop: DesktopFixture | null,
  ): boolean;
  recoverImeFocus(workspace: WorkspaceFixture): void;
}

export async function loadRefocusApi(): Promise<RefocusApi> {
  const refocusScript = await readFile(
    new URL("../../build/src/main.js", import.meta.url),
    "utf8",
  );
  const sandbox: {
    KWinImeRefocus?: RefocusApi;
    registerShortcut: (
      title: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ) => boolean;
  } = {
    registerShortcut: () => true,
  };

  createContext(sandbox);
  runInContext(refocusScript, sandbox);

  const api = sandbox.KWinImeRefocus;
  if (api === undefined) {
    throw new Error("refocus API was not loaded");
  }

  return api;
}

export function createWindow(
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

export function createWorkspace(
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
