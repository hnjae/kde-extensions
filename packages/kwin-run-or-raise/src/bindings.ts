// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
  export type ConfigReader = (
    key: string,
    defaultValue: boolean | string,
  ) => boolean | string | number | null | undefined;

  export type ShortcutRegistrar = (
    actionName: string,
    text: string,
    keySequence: string,
    callback: () => void,
  ) => void;

  function readBooleanConfig(readConfig: ConfigReader, key: string): boolean {
    const value = readConfig(key, false);

    return value === true || value === "true" || value === "1" || value === 1;
  }

  function readStringConfig(readConfig: ConfigReader, key: string): string {
    const value = readConfig(key, "");

    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function readBindingSlot(
    readConfig: ConfigReader,
    name: string,
  ): Binding | null {
    if (!readBooleanConfig(readConfig, bindingConfigKey(name, "Enabled"))) {
      return null;
    }

    const desktopEntryId = readStringConfig(
      readConfig,
      bindingConfigKey(name, "DesktopEntryId"),
    );
    const normalizedDesktopEntryId = normalizeDesktopEntryId(desktopEntryId);

    if (normalizedDesktopEntryId === "") {
      return null;
    }

    const configuredName = readStringConfig(
      readConfig,
      bindingConfigKey(name, "Name"),
    );

    return {
      actionName: bindingActionName(name),
      desktopEntryId,
      displayName: configuredName === "" ? desktopEntryId : configuredName,
      normalizedDesktopEntryId,
      shortcut: readStringConfig(
        readConfig,
        bindingConfigKey(name, "Shortcut"),
      ),
      slotName: name,
    };
  }

  export function readBinding(
    readConfig: ConfigReader,
    slot: number,
  ): Binding | null {
    return readBindingSlot(readConfig, slotName(slot));
  }

  export function readBindings(readConfig: ConfigReader): Binding[] {
    const bindings: Binding[] = [];

    for (const name of bindingSlotNames()) {
      const binding = readBindingSlot(readConfig, name);

      if (binding !== null) {
        bindings.push(binding);
      }
    }

    return bindings;
  }

  export function registerBindings(
    runtime: Runtime,
    controller: Controller,
    bindings: Binding[],
    registerShortcut: ShortcutRegistrar,
  ): void {
    const usedShortcuts: Record<string, string> = {};

    for (const binding of bindings) {
      const shortcutKey = binding.shortcut.toLocaleLowerCase();

      if (shortcutKey !== "" && usedShortcuts[shortcutKey] !== undefined) {
        runtime.log(
          `Run or Raise: skipping ${binding.slotName} because shortcut "${binding.shortcut}" is already used by ${usedShortcuts[shortcutKey]}.`,
        );
        continue;
      }

      if (shortcutKey !== "") {
        usedShortcuts[shortcutKey] = binding.slotName;
      }

      registerShortcut(
        binding.actionName,
        `Run or raise ${binding.displayName}`,
        binding.shortcut,
        () => {
          controller.handleBinding(binding);
        },
      );
    }
  }
}
