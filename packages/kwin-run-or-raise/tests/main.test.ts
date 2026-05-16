// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import test from "node:test";

import { appWindow, runScript } from "./support/run-or-raise.js";

test("registers enabled bindings with desktop entry ids", async () => {
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox.desktop",
      Binding01Enabled: true,
      Binding01Name: "Firefox",
      Binding01Shortcut: "Meta+W",
      Binding02DesktopEntryId: "org.kde.konsole",
      Binding02Enabled: false,
      Binding02Shortcut: "Meta+Return",
    },
  });

  assert.deepEqual(
    harness.registeredShortcuts.map((shortcut) => ({
      actionName: shortcut.actionName,
      keySequence: shortcut.keySequence,
      text: shortcut.text,
    })),
    [
      {
        actionName: "RunOrRaiseBinding01",
        keySequence: "Meta+W",
        text: "Run or raise Firefox",
      },
    ],
  );
});

test("skips later bindings with duplicate default shortcuts", async () => {
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox.desktop",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
      Binding02DesktopEntryId: "org.kde.konsole.desktop",
      Binding02Enabled: true,
      Binding02Shortcut: "meta+w",
    },
  });

  assert.deepEqual(
    harness.registeredShortcuts.map((shortcut) => shortcut.actionName),
    ["RunOrRaiseBinding01"],
  );
  assert.deepEqual(harness.prints, [
    'Run or Raise: skipping Binding02 because shortcut "meta+w" is already used by Binding01.',
  ]);
});

test("raises and focuses the frontmost visible matching window", async () => {
  const backWindow = appWindow();
  const frontWindow = appWindow({ desktopFileName: "firefox.desktop" });
  const otherWindow = appWindow({ desktopFileName: "org.kde.konsole" });
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "/usr/share/applications/firefox.desktop",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    stackingOrder: [backWindow, otherWindow, frontWindow],
    windows: [frontWindow, backWindow, otherWindow],
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, [frontWindow]);
  assert.equal(harness.workspace.activeWindow, frontWindow);
});

test("reads windows from workspace.windows when windowList is unavailable", async () => {
  const frontWindow = appWindow();
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    windowSource: "windows",
    windows: [frontWindow],
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, [frontWindow]);
  assert.equal(harness.workspace.activeWindow, frontWindow);
});

test("reads windows from stacking order when no window list is available", async () => {
  const frontWindow = appWindow();
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    stackingOrder: [frontWindow],
    windowSource: "stackingOrder",
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, [frontWindow]);
  assert.equal(harness.workspace.activeWindow, frontWindow);
});

test("ignores matching windows outside the current desktop and activity", async () => {
  const currentDesktop = { id: "desktop-1" };
  const otherDesktop = { id: "desktop-2" };
  const desktopWindow = appWindow({ desktops: [otherDesktop] });
  const activityWindow = appWindow({ activities: ["other-activity"] });
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    currentActivity: "activity-1",
    currentDesktop,
    windows: [desktopWindow, activityWindow],
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.dbusCalls, [
    [
      "org.kde.klauncher",
      "/KLauncher",
      "org.kde.KLauncher",
      "start_service_by_desktop_name",
      "firefox",
      [],
      [],
      "",
      false,
    ],
  ]);
  assert.deepEqual(harness.raisedWindows, []);
  assert.equal(harness.workspace.activeWindow, null);
});

test("ignores non user-facing matching windows", async () => {
  const hiddenWindow = appWindow({ hidden: true });
  const inputMethodWindow = appWindow({ inputMethod: true });
  const unmanagedDialog = appWindow({ dialog: true, managed: false });
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    windows: [hiddenWindow, inputMethodWindow, unmanagedDialog],
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.dbusCalls, [
    [
      "org.kde.klauncher",
      "/KLauncher",
      "org.kde.KLauncher",
      "start_service_by_desktop_name",
      "firefox",
      [],
      [],
      "",
      false,
    ],
  ]);
  assert.deepEqual(harness.raisedWindows, []);
  assert.equal(harness.workspace.activeWindow, null);
});

test("restores and focuses the most recently used minimized match", async () => {
  const olderWindow = appWindow({ minimized: true });
  const newerWindow = appWindow({ minimized: true });
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    windows: [olderWindow, newerWindow],
  });

  harness.notifyActivated(olderWindow);
  harness.notifyActivated(newerWindow);
  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, [newerWindow]);
  assert.equal(newerWindow.minimized, false);
  assert.equal(harness.workspace.activeWindow, newerWindow);
});

test("cycles active matching windows with a stable snapshot", async () => {
  const firstWindow = appWindow();
  const secondWindow = appWindow();
  const thirdWindow = appWindow();
  const harness = await runScript({
    activeWindow: firstWindow,
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    windows: [firstWindow, secondWindow, thirdWindow],
  });

  harness.notifyActivated(thirdWindow);
  harness.notifyActivated(secondWindow);
  harness.notifyActivated(firstWindow);
  harness.registeredShortcuts[0].callback();
  harness.registeredShortcuts[0].callback();
  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, [
    secondWindow,
    thirdWindow,
    firstWindow,
  ]);
  assert.equal(harness.workspace.activeWindow, firstWindow);
});

test("does nothing when the active matching window is the only candidate", async () => {
  const onlyWindow = appWindow();
  const harness = await runScript({
    activeWindow: onlyWindow,
    config: {
      Binding01DesktopEntryId: "firefox",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    windows: [onlyWindow],
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.raisedWindows, []);
  assert.equal(harness.workspace.activeWindow, onlyWindow);
});

test("launches through klauncher when no matching window exists", async () => {
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox.desktop",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
  });

  harness.registeredShortcuts[0].callback();

  assert.deepEqual(harness.dbusCalls, [
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
  assert.deepEqual(harness.raisedWindows, []);
});

test("prints DBus launch failures without throwing", async () => {
  const harness = await runScript({
    config: {
      Binding01DesktopEntryId: "firefox.desktop",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
    },
    dbusError: new Error("service unavailable"),
  });

  assert.doesNotThrow(() => {
    harness.registeredShortcuts[0].callback();
  });
  assert.deepEqual(harness.prints, [
    "Run or Raise: failed to launch firefox.desktop: service unavailable",
  ]);
});
