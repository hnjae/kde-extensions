// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
  export const bindingCount = 16;

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

  export type WindowScope = {
    currentActivity: string | undefined;
    currentDesktop: KWinDesktop | undefined;
  };

  export type CycleState = {
    candidates: KWinWindow[];
    index: number;
  };

  export type BindingActionInput = {
    activeWindow: KWinWindow | null;
    candidates: KWinWindow[];
    cycleState: CycleState | undefined;
    mruWindows: KWinWindow[];
    stackingOrder: KWinWindow[] | undefined;
  };

  export type BindingActionPlan =
    | {
        cycleState: CycleState | undefined;
        kind: "activate";
        window: KWinWindow;
      }
    | {
        cycleState: CycleState | undefined;
        kind: "launch" | "none";
      };

  export function slotName(slot: number): string {
    return `Binding${String(slot).padStart(2, "0")}`;
  }

  export function normalizeDesktopEntryId(desktopEntryId: string): string {
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

  function isOnCurrentDesktop(scope: WindowScope, window: KWinWindow): boolean {
    if (window.onAllDesktops === true) {
      return true;
    }

    const desktops = window.desktops ?? [];

    if (desktops.length === 0) {
      return true;
    }

    const currentDesktop = scope.currentDesktop;

    return (
      currentDesktop !== undefined &&
      desktops.some((desktop) => desktopsMatch(desktop, currentDesktop))
    );
  }

  function isOnCurrentActivity(
    scope: WindowScope,
    window: KWinWindow,
  ): boolean {
    const activities = window.activities ?? [];

    if (activities.length === 0) {
      return true;
    }

    return (
      scope.currentActivity !== undefined &&
      activities.indexOf(scope.currentActivity) >= 0
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

  export function windowMatchesBinding(
    scope: WindowScope,
    window: KWinWindow,
    binding: Binding,
  ): boolean {
    return (
      isSupportedWindow(window) &&
      isOnCurrentDesktop(scope, window) &&
      isOnCurrentActivity(scope, window) &&
      normalizeDesktopEntryId(window.desktopFileName ?? "") ===
        binding.normalizedDesktopEntryId
    );
  }

  export function candidateWindowsForBinding(
    windows: KWinWindow[],
    scope: WindowScope,
    binding: Binding,
  ): KWinWindow[] {
    return windows.filter((window) =>
      windowMatchesBinding(scope, window, binding),
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

  function orderedByMru(
    candidates: KWinWindow[],
    mruWindows: KWinWindow[],
    activeWindow: KWinWindow | null,
  ): KWinWindow[] {
    const orderedWindows: KWinWindow[] = [];

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

  function stackingRank(
    stackingOrder: KWinWindow[] | undefined,
    window: KWinWindow,
    fallbackRank: number,
  ): number {
    if (stackingOrder === undefined) {
      return fallbackRank;
    }

    const rank = stackingOrder.indexOf(window);

    return rank >= 0 ? rank : fallbackRank - stackingOrder.length;
  }

  function frontmostWindow(
    windows: KWinWindow[],
    stackingOrder: KWinWindow[] | undefined,
  ): KWinWindow | null {
    let selectedWindow: KWinWindow | null = null;
    let selectedRank = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < windows.length; index += 1) {
      const window = windows[index];
      const rank = stackingRank(stackingOrder, window, index);

      if (rank > selectedRank) {
        selectedWindow = window;
        selectedRank = rank;
      }
    }

    return selectedWindow;
  }

  function mostRecentlyUsedWindow(
    windows: KWinWindow[],
    mruWindows: KWinWindow[],
    activeWindow: KWinWindow | null,
  ): KWinWindow {
    return orderedByMru(windows, mruWindows, activeWindow)[0];
  }

  export function planBindingAction(
    input: BindingActionInput,
  ): BindingActionPlan {
    const { activeWindow, candidates, cycleState, mruWindows, stackingOrder } =
      input;

    if (activeWindow !== null && containsWindow(candidates, activeWindow)) {
      if (candidates.length <= 1) {
        return { cycleState: undefined, kind: "none" };
      }

      const orderedWindows =
        cycleState !== undefined &&
        sameWindowSet(cycleState.candidates, candidates)
          ? cycleState.candidates
          : orderedByMru(candidates, mruWindows, activeWindow);
      const activeIndex =
        cycleState !== undefined &&
        orderedWindows[cycleState.index] === activeWindow
          ? cycleState.index
          : orderedWindows.indexOf(activeWindow);
      const nextIndex = (activeIndex + 1) % orderedWindows.length;

      return {
        cycleState: {
          candidates: orderedWindows,
          index: nextIndex,
        },
        kind: "activate",
        window: orderedWindows[nextIndex],
      };
    }

    const visibleWindow = frontmostWindow(
      candidates.filter((window) => window.minimized !== true),
      stackingOrder,
    );

    if (visibleWindow !== null) {
      return {
        cycleState: undefined,
        kind: "activate",
        window: visibleWindow,
      };
    }

    const minimizedWindows = candidates.filter(
      (window) => window.minimized === true,
    );

    if (minimizedWindows.length > 0) {
      return {
        cycleState: undefined,
        kind: "activate",
        window: mostRecentlyUsedWindow(
          minimizedWindows,
          mruWindows,
          activeWindow,
        ),
      };
    }

    return { cycleState: undefined, kind: "launch" };
  }

  export function createController(runtime: Runtime): Controller {
    const mruWindows: KWinWindow[] = [];
    const cycleStates: Record<string, CycleState | undefined> = {};

    function currentScope(): WindowScope {
      return {
        currentActivity: runtime.currentActivity(),
        currentDesktop: runtime.currentDesktop(),
      };
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

    function activateWindow(window: KWinWindow): void {
      if (window.minimized === true) {
        window.minimized = false;
      }

      runtime.raiseWindow(window);
      runtime.setActiveWindow(window);
      rememberWindow(window);
    }

    function handleBinding(binding: Binding): void {
      const activeWindow = runtime.activeWindow();
      const candidates = candidateWindowsForBinding(
        runtime.windows(),
        currentScope(),
        binding,
      );
      const plan = planBindingAction({
        activeWindow,
        candidates,
        cycleState: cycleStates[binding.actionName],
        mruWindows,
        stackingOrder: runtime.stackingOrder(),
      });

      cycleStates[binding.actionName] = plan.cycleState;

      if (plan.kind === "none") {
        return;
      }

      if (plan.kind === "activate") {
        activateWindow(plan.window);
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
}
