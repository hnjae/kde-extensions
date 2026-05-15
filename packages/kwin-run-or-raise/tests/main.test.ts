// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

type RegisteredShortcut = {
  actionName: string;
  callback: () => void;
  keySequence: string;
  text: string;
};

type ScriptHarness = {
  prints: string[];
  registeredShortcuts: RegisteredShortcut[];
};

const mainScriptUrl = new URL(
  "../dist/kwin-run-or-raise/contents/code/main.js",
  import.meta.url,
);

async function runScript(
  config: Record<string, unknown>,
): Promise<ScriptHarness> {
  const script = await readFile(mainScriptUrl, "utf8");
  const registeredShortcuts: RegisteredShortcut[] = [];
  const prints: string[] = [];

  vm.runInNewContext(script, {
    print(message: string): void {
      prints.push(message);
    },
    readConfig(key: string, defaultValue: unknown): unknown {
      return Object.prototype.hasOwnProperty.call(config, key)
        ? config[key]
        : defaultValue;
    },
    registerShortcut(
      actionName: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ): void {
      registeredShortcuts.push({ actionName, callback, keySequence, text });
    },
    workspace: {
      activeWindow: null,
      raiseWindow(): void {},
    },
  });

  return { prints, registeredShortcuts };
}

test("registers enabled bindings with desktop entry ids", async () => {
  const harness = await runScript({
    Binding01DesktopEntryId: "firefox.desktop",
    Binding01Enabled: true,
    Binding01Name: "Firefox",
    Binding01Shortcut: "Meta+W",
    Binding02DesktopEntryId: "org.kde.konsole",
    Binding02Enabled: false,
    Binding02Shortcut: "Meta+Return",
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
    Binding01DesktopEntryId: "firefox.desktop",
    Binding01Enabled: true,
    Binding01Shortcut: "Meta+W",
    Binding02DesktopEntryId: "org.kde.konsole.desktop",
    Binding02Enabled: true,
    Binding02Shortcut: "meta+w",
  });

  assert.deepEqual(
    harness.registeredShortcuts.map((shortcut) => shortcut.actionName),
    ["RunOrRaiseBinding01"],
  );
  assert.deepEqual(harness.prints, [
    'Run or Raise: skipping Binding02 because shortcut "meta+w" is already used by Binding01.',
  ]);
});
