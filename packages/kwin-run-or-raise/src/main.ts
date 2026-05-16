// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
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

  function describeError(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }

    return String(error);
  }

  function createKWinRuntime(): RunOrRaise.Runtime {
    return {
      activeWindow(): KWinWindow | null {
        return workspace.activeWindow;
      },
      currentActivity(): string | undefined {
        return workspace.currentActivity;
      },
      currentDesktop(): KWinDesktop | undefined {
        return workspace.currentDesktop;
      },
      launchDesktopEntry(desktopEntryId: string): void {
        try {
          callDBus(
            "org.kde.klauncher",
            "/KLauncher",
            "org.kde.KLauncher",
            "start_service_by_desktop_name",
            desktopEntryId,
            [],
            [],
            "",
            false,
          );
        } catch (error) {
          print(
            `Run or Raise: failed to launch ${desktopEntryId}: ${describeError(error)}`,
          );
        }
      },
      log(message: string): void {
        print(message);
      },
      raiseWindow(window: KWinWindow): void {
        workspace.raiseWindow(window);
      },
      setActiveWindow(window: KWinWindow): void {
        workspace.activeWindow = window;
      },
      stackingOrder(): KWinWindow[] | undefined {
        return Array.isArray(workspace.stackingOrder)
          ? workspace.stackingOrder
          : undefined;
      },
      windows(): KWinWindow[] {
        if (typeof workspace.windowList === "function") {
          return workspace.windowList();
        }

        if (Array.isArray(workspace.windows)) {
          return workspace.windows;
        }

        if (Array.isArray(workspace.stackingOrder)) {
          return workspace.stackingOrder;
        }

        return [];
      },
    };
  }

  function readBinding(slot: number): RunOrRaise.Binding | null {
    const name = RunOrRaise.slotName(slot);

    if (!readBooleanConfig(`${name}Enabled`)) {
      return null;
    }

    const desktopEntryId = readStringConfig(`${name}DesktopEntryId`);
    const normalizedDesktopEntryId =
      RunOrRaise.normalizeDesktopEntryId(desktopEntryId);

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

  function registerBindings(
    runtime: RunOrRaise.Runtime,
    controller: RunOrRaise.Controller,
  ): void {
    const usedShortcuts: Record<string, string> = {};

    for (let slot = 1; slot <= RunOrRaise.bindingCount; slot += 1) {
      const binding = readBinding(slot);

      if (binding === null) {
        continue;
      }

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

  const runtime = createKWinRuntime();
  const controller = RunOrRaise.createController(runtime);

  if (workspace.windowActivated !== undefined) {
    workspace.windowActivated.connect((window) => {
      controller.rememberWindow(window);
    });
  }

  if (workspace.windowRemoved !== undefined) {
    workspace.windowRemoved.connect((window) => {
      controller.forgetWindow(window);
    });
  }

  registerBindings(runtime, controller);
})();
