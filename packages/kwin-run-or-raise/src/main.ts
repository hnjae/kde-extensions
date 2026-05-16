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

  type CycleState = {
    candidates: KWinWindow[];
    index: number;
  };

  type RunOrRaiseRuntime = {
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

  type RunOrRaiseController = {
    forgetWindow(window: KWinWindow): void;
    handleBinding(binding: Binding): void;
    rememberWindow(window: KWinWindow | null): void;
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

  function desktopIdentity(desktop: KWinDesktop | undefined): string {
    if (desktop === undefined) {
      return "";
    }

    return desktop.id ?? desktop.name ?? "";
  }

  function desktopsMatch(
    desktop: KWinDesktop,
    currentDesktop: KWinDesktop,
  ): boolean {
    if (desktop === currentDesktop) {
      return true;
    }

    const desktopId = desktopIdentity(desktop);

    return desktopId !== "" && desktopId === desktopIdentity(currentDesktop);
  }

  function isOnCurrentDesktop(
    runtime: RunOrRaiseRuntime,
    window: KWinWindow,
  ): boolean {
    if (window.onAllDesktops === true) {
      return true;
    }

    const desktops = window.desktops ?? [];

    if (desktops.length === 0) {
      return true;
    }

    const currentDesktop = runtime.currentDesktop();

    return (
      currentDesktop !== undefined &&
      desktops.some((desktop) => desktopsMatch(desktop, currentDesktop))
    );
  }

  function isOnCurrentActivity(
    runtime: RunOrRaiseRuntime,
    window: KWinWindow,
  ): boolean {
    const activities = window.activities ?? [];

    if (activities.length === 0) {
      return true;
    }

    const currentActivity = runtime.currentActivity();

    return (
      currentActivity !== undefined && activities.indexOf(currentActivity) >= 0
    );
  }

  function isSupportedWindow(window: KWinWindow): boolean {
    return (
      window.managed === true &&
      window.deleted !== true &&
      window.hidden !== true &&
      window.inputMethod !== true &&
      window.wantsInput === true &&
      (window.normalWindow === true || window.dialog === true)
    );
  }

  function windowMatchesBinding(
    runtime: RunOrRaiseRuntime,
    window: KWinWindow,
    binding: Binding,
  ): boolean {
    return (
      isSupportedWindow(window) &&
      isOnCurrentDesktop(runtime, window) &&
      isOnCurrentActivity(runtime, window) &&
      normalizeDesktopEntryId(window.desktopFileName ?? "") ===
        binding.normalizedDesktopEntryId
    );
  }

  function containsWindow(windows: KWinWindow[], window: KWinWindow): boolean {
    return windows.indexOf(window) >= 0;
  }

  function sameWindowSet(
    leftWindows: KWinWindow[],
    rightWindows: KWinWindow[],
  ): boolean {
    return (
      leftWindows.length === rightWindows.length &&
      leftWindows.every((window) => containsWindow(rightWindows, window))
    );
  }

  function describeError(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }

    return String(error);
  }

  function createKWinRuntime(): RunOrRaiseRuntime {
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

  function createRunOrRaiseController(
    runtime: RunOrRaiseRuntime,
  ): RunOrRaiseController {
    const mruWindows: KWinWindow[] = [];
    const cycleStates: Record<string, CycleState | undefined> = {};

    function matchingWindows(binding: Binding): KWinWindow[] {
      return runtime
        .windows()
        .filter((window) => windowMatchesBinding(runtime, window, binding));
    }

    function removeFromMru(window: KWinWindow): void {
      const index = mruWindows.indexOf(window);

      if (index >= 0) {
        mruWindows.splice(index, 1);
      }
    }

    function rememberWindow(window: KWinWindow | null): void {
      if (window === null) {
        return;
      }

      removeFromMru(window);
      mruWindows.unshift(window);

      if (mruWindows.length > 100) {
        mruWindows.pop();
      }
    }

    function forgetWindow(window: KWinWindow): void {
      removeFromMru(window);

      for (const actionName in cycleStates) {
        const state = cycleStates[actionName];

        if (state !== undefined && state.candidates.indexOf(window) >= 0) {
          cycleStates[actionName] = undefined;
        }
      }
    }

    function orderedByMru(candidates: KWinWindow[]): KWinWindow[] {
      const orderedWindows: KWinWindow[] = [];
      const activeWindow = runtime.activeWindow();

      if (activeWindow !== null && containsWindow(candidates, activeWindow)) {
        orderedWindows.push(activeWindow);
      }

      for (const window of mruWindows) {
        if (
          containsWindow(candidates, window) &&
          !containsWindow(orderedWindows, window)
        ) {
          orderedWindows.push(window);
        }
      }

      for (const window of candidates) {
        if (!containsWindow(orderedWindows, window)) {
          orderedWindows.push(window);
        }
      }

      return orderedWindows;
    }

    function stackingRank(window: KWinWindow, fallbackRank: number): number {
      const stackingOrder = runtime.stackingOrder();

      if (stackingOrder === undefined) {
        return fallbackRank;
      }

      const rank = stackingOrder.indexOf(window);

      return rank >= 0 ? rank : fallbackRank - stackingOrder.length;
    }

    function frontmostWindow(windows: KWinWindow[]): KWinWindow | null {
      let selectedWindow: KWinWindow | null = null;
      let selectedRank = Number.NEGATIVE_INFINITY;

      for (let index = 0; index < windows.length; index += 1) {
        const window = windows[index];
        const rank = stackingRank(window, index);

        if (rank > selectedRank) {
          selectedWindow = window;
          selectedRank = rank;
        }
      }

      return selectedWindow;
    }

    function activateWindow(window: KWinWindow): void {
      if (window.minimized === true) {
        window.minimized = false;
      }

      runtime.raiseWindow(window);
      runtime.setActiveWindow(window);
      rememberWindow(window);
    }

    function cycleFocusedWindow(
      binding: Binding,
      candidates: KWinWindow[],
    ): boolean {
      const activeWindow = runtime.activeWindow();

      if (activeWindow === null || !containsWindow(candidates, activeWindow)) {
        return false;
      }

      if (candidates.length <= 1) {
        cycleStates[binding.actionName] = undefined;
        return true;
      }

      const existingState = cycleStates[binding.actionName];
      const orderedWindows =
        existingState !== undefined &&
        sameWindowSet(existingState.candidates, candidates)
          ? existingState.candidates
          : orderedByMru(candidates);
      const activeIndex =
        existingState !== undefined &&
        orderedWindows[existingState.index] === activeWindow
          ? existingState.index
          : orderedWindows.indexOf(activeWindow);
      const nextIndex = (activeIndex + 1) % orderedWindows.length;
      const nextWindow = orderedWindows[nextIndex];

      cycleStates[binding.actionName] = {
        candidates: orderedWindows,
        index: nextIndex,
      };

      activateWindow(nextWindow);

      return true;
    }

    function mostRecentlyUsedWindow(windows: KWinWindow[]): KWinWindow {
      return orderedByMru(windows)[0];
    }

    function handleBinding(binding: Binding): void {
      const candidates = matchingWindows(binding);

      if (cycleFocusedWindow(binding, candidates)) {
        return;
      }

      cycleStates[binding.actionName] = undefined;

      const visibleWindow = frontmostWindow(
        candidates.filter((window) => window.minimized !== true),
      );

      if (visibleWindow !== null) {
        activateWindow(visibleWindow);
        return;
      }

      const minimizedWindows = candidates.filter(
        (window) => window.minimized === true,
      );

      if (minimizedWindows.length > 0) {
        activateWindow(mostRecentlyUsedWindow(minimizedWindows));
        return;
      }

      runtime.launchDesktopEntry(binding.desktopEntryId);
    }

    return {
      forgetWindow,
      handleBinding,
      rememberWindow,
    };
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

  function registerBindings(
    runtime: RunOrRaiseRuntime,
    controller: RunOrRaiseController,
  ): void {
    const usedShortcuts: Record<string, string> = {};

    for (let slot = 1; slot <= bindingCount; slot += 1) {
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
  const controller = createRunOrRaiseController(runtime);

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
