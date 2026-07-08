// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import test from "node:test";

import {
  type Binding,
  configReader,
  loadRunOrRaise,
  plainJson,
  type RegisteredShortcut,
  type RunOrRaiseBindingsApi,
} from "./support/run-or-raise.js";

async function loadBindings(): Promise<RunOrRaiseBindingsApi> {
  return loadRunOrRaise<RunOrRaiseBindingsApi>(["core", "bindings"]);
}

test("reads configured bindings from KWin config slots", async () => {
  const runOrRaise = await loadBindings();

  assert.deepEqual(
    plainJson(
      runOrRaise.readBindings(
        configReader({
          Binding01DesktopEntryId: " /usr/share/applications/firefox.desktop ",
          Binding01Enabled: "1",
          Binding01Name: " Firefox ",
          Binding01Shortcut: " Meta+W ",
          Binding02DesktopEntryId: "   ",
          Binding02Enabled: true,
          Binding03DesktopEntryId: "org.kde.konsole",
          Binding03Enabled: false,
        }),
      ),
    ),
    [
      {
        actionName: "RunOrRaiseBinding01",
        desktopEntryId: "/usr/share/applications/firefox.desktop",
        displayName: "Firefox",
        normalizedDesktopEntryId: "firefox",
        shortcut: "Meta+W",
        slotName: "Binding01",
      },
    ],
  );
});

test("registers bindings once per non-empty shortcut", async () => {
  const runOrRaise = await loadBindings();
  const bindings = runOrRaise.readBindings(
    configReader({
      Binding01DesktopEntryId: "firefox.desktop",
      Binding01Enabled: true,
      Binding01Shortcut: "Meta+W",
      Binding02DesktopEntryId: "org.kde.konsole.desktop",
      Binding02Enabled: true,
      Binding02Shortcut: "meta+w",
    }),
  );
  const handledBindings: Binding[] = [];
  const registeredShortcuts: RegisteredShortcut[] = [];

  runOrRaise.registerBindings(
    {
      log(): void {},
    },
    {
      handleBinding(binding: Binding): void {
        handledBindings.push(binding);
      },
    },
    bindings,
    (actionName, text, keySequence, callback) => {
      registeredShortcuts.push({ actionName, callback, keySequence, text });
    },
  );

  assert.deepEqual(
    registeredShortcuts.map((shortcut) => ({
      actionName: shortcut.actionName,
      keySequence: shortcut.keySequence,
    })),
    [
      {
        actionName: "RunOrRaiseBinding01",
        keySequence: "Meta+W",
      },
    ],
  );

  registeredShortcuts[0].callback();

  assert.deepEqual(handledBindings, [bindings[0]]);
});
