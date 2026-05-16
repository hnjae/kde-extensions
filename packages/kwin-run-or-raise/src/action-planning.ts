// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
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
}
