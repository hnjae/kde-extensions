// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
  const bindingCount = 16;

  type Binding = {
    actionName: string;
    desktopEntryId: string;
    displayName: string;
    normalizedDesktopEntryId: string;
    shortcut: string;
    slotName: string;
  };

  function readBooleanConfig(key: string): boolean {
    const value = readConfig(key, false);

    return value === true || value === "true" || value === "1" || value === 1;
  }

  function readStringConfig(key: string): string {
    const value = readConfig(key, "");

    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function slotName(slot: number): string {
    return `Binding${String(slot).padStart(2, "0")}`;
  }

  function normalizeDesktopEntryId(desktopEntryId: string): string {
    const basename = desktopEntryId.trim().split(/[\\/]/).pop() ?? "";

    return basename.endsWith(".desktop")
      ? basename.slice(0, -".desktop".length)
      : basename;
  }

  function readBinding(slot: number): Binding | null {
    const name = slotName(slot);

    if (!readBooleanConfig(`${name}Enabled`)) {
      return null;
    }

    const desktopEntryId = readStringConfig(`${name}DesktopEntryId`);
    const normalizedDesktopEntryId = normalizeDesktopEntryId(desktopEntryId);

    if (normalizedDesktopEntryId === "") {
      return null;
    }

    const configuredName = readStringConfig(`${name}Name`);

    return {
      actionName: `RunOrRaise${name}`,
      desktopEntryId,
      displayName: configuredName === "" ? desktopEntryId : configuredName,
      normalizedDesktopEntryId,
      shortcut: readStringConfig(`${name}Shortcut`),
      slotName: name,
    };
  }

  function handleBinding(binding: Binding): void {
    void binding;
  }

  const usedShortcuts: Record<string, string> = {};

  for (let slot = 1; slot <= bindingCount; slot += 1) {
    const binding = readBinding(slot);

    if (binding === null) {
      continue;
    }

    const shortcutKey = binding.shortcut.toLocaleLowerCase();

    if (shortcutKey !== "" && usedShortcuts[shortcutKey] !== undefined) {
      print(
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
        handleBinding(binding);
      },
    );
  }
})();
