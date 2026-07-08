// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import test from "node:test";

import {
  appWindow,
  binding,
  loadRunOrRaise,
  type RunOrRaiseCoreApi,
} from "./support/run-or-raise.js";

async function loadCore(): Promise<RunOrRaiseCoreApi> {
  return loadRunOrRaise<RunOrRaiseCoreApi>([
    "core",
    "window-matching",
    "action-planning",
  ]);
}

test("filters binding candidates by support, identity, desktop, and activity", async () => {
  const runOrRaise = await loadCore();
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
  const runOrRaise = await loadCore();
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
  const runOrRaise = await loadCore();
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
  const runOrRaise = await loadCore();
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
});

test("plans no-op for one active candidate and launch for no candidates", async () => {
  const runOrRaise = await loadCore();
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
