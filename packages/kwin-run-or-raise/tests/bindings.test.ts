// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

type Binding = {
  actionName: string;
  desktopEntryId: string;
  displayName: string;
  normalizedDesktopEntryId: string;
  shortcut: string;
  slotName: string;
};

type ConfigReader = (
  key: string,
  defaultValue: boolean | string,
) => boolean | string | number | null | undefined;

type RegisteredShortcut = {
  actionName: string;
  callback: () => void;
  keySequence: string;
  text: string;
};

type RunOrRaiseApi = {
  readBindings(readConfig: ConfigReader): Binding[];
  registerBindings(
    runtime: { log(message: string): void },
    controller: { handleBinding(binding: Binding): void },
    bindings: Binding[],
    registerShortcut: (
      actionName: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ) => void,
  ): void;
};

function plainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const sourceUrls = [
  new URL("../build/src/core.js", import.meta.url),
  new URL("../build/src/bindings.js", import.meta.url),
];

async function loadRunOrRaise(): Promise<RunOrRaiseApi> {
  const source = await Promise.all(
    sourceUrls.map((url) => readFile(url, "utf8")),
  );

  return vm.runInNewContext(
    `${source.join("\n")}\nRunOrRaise;`,
    {},
  ) as RunOrRaiseApi;
}

function configReader(config: Record<string, unknown>): ConfigReader {
  const keys = new Set(Object.keys(config));

  return (key, defaultValue) =>
    keys.has(key)
      ? (config[key] as boolean | string | number | null | undefined)
      : defaultValue;
}

test("reads configured bindings from KWin config slots", async () => {
  const runOrRaise = await loadRunOrRaise();

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
  const runOrRaise = await loadRunOrRaise();
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
  const logs: string[] = [];
  const registeredShortcuts: RegisteredShortcut[] = [];

  runOrRaise.registerBindings(
    {
      log(message: string): void {
        logs.push(message);
      },
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
      text: shortcut.text,
    })),
    [
      {
        actionName: "RunOrRaiseBinding01",
        keySequence: "Meta+W",
        text: "Run or raise firefox.desktop",
      },
    ],
  );
  assert.deepEqual(logs, [
    'Run or Raise: skipping Binding02 because shortcut "meta+w" is already used by Binding01.',
  ]);

  registeredShortcuts[0].callback();

  assert.deepEqual(handledBindings, [bindings[0]]);
});
