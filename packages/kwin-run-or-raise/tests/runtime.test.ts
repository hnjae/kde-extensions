// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadRunOrRaise,
  plainJson,
  type RunOrRaiseRuntimeApi,
  type TestWindow,
  workspace,
} from "./support/run-or-raise.js";

async function loadRuntime(): Promise<RunOrRaiseRuntimeApi> {
  return loadRunOrRaise<RunOrRaiseRuntimeApi>(["core", "runtime"]);
}

test("adapts KWin workspace state and actions into a controller runtime", async () => {
  const runOrRaise = await loadRuntime();
  const firstWindow = {};
  const secondWindow = {};
  const raisedWindows: TestWindow[] = [];
  const testWorkspace = workspace({
    activeWindow: firstWindow,
    raiseWindow(window): void {
      raisedWindows.push(window);
    },
    stackingOrder: [firstWindow, secondWindow],
    windowList: () => [secondWindow],
  });
  const runtime = runOrRaise.createKWinRuntime({
    callDBus(): void {},
    print(): void {},
    workspace: testWorkspace,
  });

  assert.equal(runtime.activeWindow(), firstWindow);
  assert.equal(runtime.currentActivity(), "activity-1");
  assert.deepEqual(runtime.currentDesktop(), { id: "desktop-1" });
  assert.deepEqual(runtime.stackingOrder(), [firstWindow, secondWindow]);
  assert.deepEqual(runtime.windows(), [secondWindow]);

  runtime.raiseWindow(secondWindow);
  runtime.setActiveWindow(secondWindow);

  assert.deepEqual(raisedWindows, [secondWindow]);
  assert.equal(testWorkspace.activeWindow, secondWindow);
});

test("falls back across supported KWin window sources", async () => {
  const runOrRaise = await loadRuntime();
  const windowListWindow = {};
  const windowsWindow = {};
  const stackingWindow = {};
  const windowListRuntime = runOrRaise.createKWinRuntime({
    callDBus(): void {},
    print(): void {},
    workspace: workspace({
      stackingOrder: [stackingWindow],
      windowList: () => [windowListWindow],
      windows: [windowsWindow],
    }),
  });
  const windowsRuntime = runOrRaise.createKWinRuntime({
    callDBus(): void {},
    print(): void {},
    workspace: workspace({
      stackingOrder: [stackingWindow],
      windows: [windowsWindow],
    }),
  });
  const stackingRuntime = runOrRaise.createKWinRuntime({
    callDBus(): void {},
    print(): void {},
    workspace: workspace({
      stackingOrder: [stackingWindow],
    }),
  });
  const emptyRuntime = runOrRaise.createKWinRuntime({
    callDBus(): void {},
    print(): void {},
    workspace: workspace(),
  });

  assert.equal(windowListRuntime.windows()[0], windowListWindow);
  assert.equal(windowsRuntime.windows()[0], windowsWindow);
  assert.equal(stackingRuntime.windows()[0], stackingWindow);
  assert.equal(emptyRuntime.windows().length, 0);
});

test("launches desktop entries through klauncher and reports failures", async () => {
  const runOrRaise = await loadRuntime();
  const dbusCalls: unknown[][] = [];
  const prints: string[] = [];
  const runtime = runOrRaise.createKWinRuntime({
    callDBus(...args): void {
      dbusCalls.push(args);
    },
    print(message): void {
      prints.push(message);
    },
    workspace: workspace(),
  });

  runtime.launchDesktopEntry("firefox.desktop");
  runtime.log("test log");

  assert.deepEqual(plainJson(dbusCalls), [
    [
      "org.kde.klauncher",
      "/KLauncher",
      "org.kde.KLauncher",
      "start_service_by_desktop_name",
      "firefox.desktop",
      [],
      [],
      "",
      false,
    ],
  ]);
  assert.deepEqual(prints, ["test log"]);

  const failingRuntime = runOrRaise.createKWinRuntime({
    callDBus(): void {
      throw new Error("service unavailable");
    },
    print(message): void {
      prints.push(message);
    },
    workspace: workspace(),
  });

  const printCountBeforeFailure = prints.length;

  assert.doesNotThrow(() => {
    failingRuntime.launchDesktopEntry("org.kde.konsole");
  });
  assert.equal(prints.length, printCountBeforeFailure + 1);
});

test("connects optional workspace signals to controller state hooks", async () => {
  const runOrRaise = await loadRuntime();
  const activatedWindow = {};
  const removedWindow = {};
  const rememberedWindows: Array<TestWindow | null> = [];
  const forgottenWindows: TestWindow[] = [];
  let activationCallback: ((window: TestWindow | null) => void) | undefined;
  let removalCallback: ((window: TestWindow) => void) | undefined;
  const testWorkspace = workspace({
    windowActivated: {
      connect(callback): void {
        activationCallback = callback;
      },
    },
    windowRemoved: {
      connect(callback): void {
        removalCallback = callback;
      },
    },
  });

  runOrRaise.connectWorkspaceSignals(testWorkspace, {
    forgetWindow(window): void {
      forgottenWindows.push(window);
    },
    rememberWindow(window): void {
      rememberedWindows.push(window);
    },
  });

  activationCallback?.(activatedWindow);
  activationCallback?.(null);
  removalCallback?.(removedWindow);

  assert.deepEqual(rememberedWindows, [activatedWindow, null]);
  assert.deepEqual(forgottenWindows, [removedWindow]);
});
