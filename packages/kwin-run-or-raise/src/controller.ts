// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
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
