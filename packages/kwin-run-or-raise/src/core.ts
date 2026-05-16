// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
  export const bindingCount = 16;

  export type BindingConfigFieldName =
    | "Enabled"
    | "Name"
    | "DesktopEntryId"
    | "Shortcut";

  export type BindingConfigField = {
    defaultValue: boolean | string;
    label: string;
    name: BindingConfigFieldName;
    valueType: "Bool" | "String";
    widgetClass: "QCheckBox" | "QLineEdit";
  };

  export const bindingConfigFields: BindingConfigField[] = [
    {
      defaultValue: false,
      label: "Enabled",
      name: "Enabled",
      valueType: "Bool",
      widgetClass: "QCheckBox",
    },
    {
      defaultValue: "",
      label: "Name",
      name: "Name",
      valueType: "String",
      widgetClass: "QLineEdit",
    },
    {
      defaultValue: "",
      label: "Desktop Entry ID",
      name: "DesktopEntryId",
      valueType: "String",
      widgetClass: "QLineEdit",
    },
    {
      defaultValue: "",
      label: "Default Shortcut",
      name: "Shortcut",
      valueType: "String",
      widgetClass: "QLineEdit",
    },
  ];

  export type Binding = {
    actionName: string;
    desktopEntryId: string;
    displayName: string;
    normalizedDesktopEntryId: string;
    shortcut: string;
    slotName: string;
  };

  export type Runtime = {
    activeWindow(): KWinWindow | null;
    currentActivity(): string | undefined;
    currentDesktop(): KWinDesktop | undefined;
    launchDesktopEntry(desktopEntryId: string): void;
    log(message: string): void;
    raiseWindow(window: KWinWindow): void;
    setActiveWindow(window: KWinWindow): void;
    stackingOrder(): KWinWindow[] | undefined;
    windows(): KWinWindow[];
  };

  export type Controller = {
    forgetWindow(window: KWinWindow): void;
    handleBinding(binding: Binding): void;
    rememberWindow(window: KWinWindow | null): void;
  };

  export function slotName(slot: number): string {
    return `Binding${String(slot).padStart(2, "0")}`;
  }

  export function bindingSlotNames(): string[] {
    return Array.from({ length: bindingCount }, (_, index) =>
      slotName(index + 1),
    );
  }

  export function bindingActionName(slotName: string): string {
    return `RunOrRaise${slotName}`;
  }

  export function bindingConfigKey(
    slotName: string,
    fieldName: BindingConfigFieldName,
  ): string {
    return `${slotName}${fieldName}`;
  }

  export function normalizeDesktopEntryId(desktopEntryId: string): string {
    const basename = desktopEntryId.trim().split(/[\\/]/).pop() ?? "";

    return basename.endsWith(".desktop")
      ? basename.slice(0, -".desktop".length)
      : basename;
  }
}
