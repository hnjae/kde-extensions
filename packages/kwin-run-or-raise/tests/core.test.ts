// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

type TestDesktop = {
  id?: string;
  name?: string;
};

type TestWindow = {
  activities?: string[];
  deleted?: boolean;
  desktopFileName?: string;
  desktops?: TestDesktop[];
  dialog?: boolean;
  hidden?: boolean;
  inputMethod?: boolean;
  managed?: boolean;
  minimized?: boolean;
  normalWindow?: boolean;
  onAllDesktops?: boolean;
  wantsInput?: boolean;
};

type Binding = {
  actionName: string;
  desktopEntryId: string;
  displayName: string;
  normalizedDesktopEntryId: string;
  shortcut: string;
  slotName: string;
};

type WindowScope = {
  currentActivity: string | undefined;
  currentDesktop: TestDesktop | undefined;
};

type CycleState = {
  candidates: TestWindow[];
  index: number;
};

type BindingActionInput = {
  activeWindow: TestWindow | null;
  candidates: TestWindow[];
  cycleState: CycleState | undefined;
  mruWindows: TestWindow[];
  stackingOrder: TestWindow[] | undefined;
};

type BindingActionPlan =
  | {
      cycleState: CycleState | undefined;
      kind: "activate";
      window: TestWindow;
    }
  | {
      cycleState: CycleState | undefined;
      kind: "launch" | "none";
    };

type RunOrRaiseApi = {
  candidateWindowsForBinding(
    windows: TestWindow[],
    scope: WindowScope,
    binding: Binding,
  ): TestWindow[];
  normalizeDesktopEntryId(desktopEntryId: string): string;
  planBindingAction(input: BindingActionInput): BindingActionPlan;
};

const sourceUrl = new URL("../build/src/core.js", import.meta.url);

async function loadRunOrRaise(): Promise<RunOrRaiseApi> {
  const source = await readFile(sourceUrl, "utf8");

  return vm.runInNewContext(`${source}\nRunOrRaise;`, {}) as RunOrRaiseApi;
}

function appWindow(overrides: Partial<TestWindow> = {}): TestWindow {
  return {
    activities: [],
    desktopFileName: "firefox",
    desktops: [],
    managed: true,
    normalWindow: true,
    wantsInput: true,
    ...overrides,
  };
}

function binding(overrides: Partial<Binding> = {}): Binding {
  return {
    actionName: "RunOrRaiseBinding01",
    desktopEntryId: "firefox.desktop",
    displayName: "Firefox",
    normalizedDesktopEntryId: "firefox",
    shortcut: "Meta+W",
    slotName: "Binding01",
    ...overrides,
  };
}

test("filters binding candidates by support, identity, desktop, and activity", async () => {
  const runOrRaise = await loadRunOrRaise();
  const currentDesktop = { id: "desktop-1" };
  const matchingWindow = appWindow({
    desktopFileName: "/usr/share/applications/firefox.desktop",
    desktops: [currentDesktop],
  });
  const otherDesktopWindow = appWindow({
    desktops: [{ id: "desktop-2" }],
  });
  const otherActivityWindow = appWindow({
    activities: ["activity-2"],
  });
  const hiddenWindow = appWindow({
    hidden: true,
  });
  const otherAppWindow = appWindow({
    desktopFileName: "org.kde.konsole",
  });

  const candidates = runOrRaise.candidateWindowsForBinding(
    [
      matchingWindow,
      otherDesktopWindow,
      otherActivityWindow,
      hiddenWindow,
      otherAppWindow,
    ],
    {
      currentActivity: "activity-1",
      currentDesktop,
    },
    binding(),
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0], matchingWindow);
});

test("plans the frontmost visible candidate from a stacking-order snapshot", async () => {
  const runOrRaise = await loadRunOrRaise();
  const backWindow = appWindow();
  const frontWindow = appWindow();

  const plan = runOrRaise.planBindingAction({
    activeWindow: null,
    candidates: [frontWindow, backWindow],
    cycleState: undefined,
    mruWindows: [],
    stackingOrder: [backWindow, frontWindow],
  });

  assert.equal(plan.kind, "activate");
  assert.equal(plan.cycleState, undefined);

  if (plan.kind === "activate") {
    assert.equal(plan.window, frontWindow);
  }
});

test("plans minimized activation by most recently used order", async () => {
  const runOrRaise = await loadRunOrRaise();
  const olderWindow = appWindow({ minimized: true });
  const newerWindow = appWindow({ minimized: true });

  const plan = runOrRaise.planBindingAction({
    activeWindow: null,
    candidates: [olderWindow, newerWindow],
    cycleState: undefined,
    mruWindows: [newerWindow, olderWindow],
    stackingOrder: undefined,
  });

  assert.equal(plan.kind, "activate");

  if (plan.kind === "activate") {
    assert.equal(plan.window, newerWindow);
  }
});

test("plans focused-window cycling with a stable candidate snapshot", async () => {
  const runOrRaise = await loadRunOrRaise();
  const firstWindow = appWindow();
  const secondWindow = appWindow();
  const thirdWindow = appWindow();

  const firstPlan = runOrRaise.planBindingAction({
    activeWindow: firstWindow,
    candidates: [firstWindow, secondWindow, thirdWindow],
    cycleState: undefined,
    mruWindows: [firstWindow, secondWindow, thirdWindow],
    stackingOrder: undefined,
  });

  assert.equal(firstPlan.kind, "activate");

  if (firstPlan.kind !== "activate") {
    throw new Error("Expected first plan to activate a window");
  }

  assert.equal(firstPlan.window, secondWindow);
  assert.equal(firstPlan.cycleState?.index, 1);
  assert.equal(firstPlan.cycleState?.candidates[0], firstWindow);
  assert.equal(firstPlan.cycleState?.candidates[1], secondWindow);
  assert.equal(firstPlan.cycleState?.candidates[2], thirdWindow);

  const secondPlan = runOrRaise.planBindingAction({
    activeWindow: secondWindow,
    candidates: [thirdWindow, secondWindow, firstWindow],
    cycleState: firstPlan.cycleState,
    mruWindows: [secondWindow, firstWindow, thirdWindow],
    stackingOrder: undefined,
  });

  assert.equal(secondPlan.kind, "activate");

  if (secondPlan.kind === "activate") {
    assert.equal(secondPlan.window, thirdWindow);
  }
  assert.equal(secondPlan.cycleState?.index, 2);
  assert.equal(secondPlan.cycleState?.candidates[0], firstWindow);
  assert.equal(secondPlan.cycleState?.candidates[1], secondWindow);
  assert.equal(secondPlan.cycleState?.candidates[2], thirdWindow);
});

test("plans no-op for one active candidate and launch for no candidates", async () => {
  const runOrRaise = await loadRunOrRaise();
  const onlyWindow = appWindow();

  const noOpPlan = runOrRaise.planBindingAction({
    activeWindow: onlyWindow,
    candidates: [onlyWindow],
    cycleState: {
      candidates: [onlyWindow],
      index: 0,
    },
    mruWindows: [onlyWindow],
    stackingOrder: undefined,
  });
  const launchPlan = runOrRaise.planBindingAction({
    activeWindow: null,
    candidates: [],
    cycleState: undefined,
    mruWindows: [],
    stackingOrder: undefined,
  });

  assert.equal(noOpPlan.kind, "none");
  assert.equal(noOpPlan.cycleState, undefined);
  assert.equal(launchPlan.kind, "launch");
  assert.equal(launchPlan.cycleState, undefined);
});
