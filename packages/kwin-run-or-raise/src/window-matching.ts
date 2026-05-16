// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
  export type WindowScope = {
    currentActivity: string | undefined;
    currentDesktop: KWinDesktop | undefined;
  };

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
}
