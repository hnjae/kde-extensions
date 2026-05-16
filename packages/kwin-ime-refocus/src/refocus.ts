// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: consumed by main.ts in the compiler bundle.
namespace KWinImeRefocus {
  export interface RefocusTarget {
    readonly desktop: KWinVirtualDesktop;
    readonly window: KWinWindow;
  }

  export function isSameDesktop(
    left: KWinVirtualDesktop | null,
    right: KWinVirtualDesktop | null,
  ): boolean {
    if (left === null || right === null) {
      return left === right;
    }

    return left === right || left.id === right.id;
  }

  export function isWindowOnDesktop(
    window: KWinWindow,
    desktop: KWinVirtualDesktop | null,
  ): boolean {
    if (desktop === null) {
      return false;
    }

    if (window.onAllDesktops) {
      return true;
    }

    return window.desktops.some((windowDesktop) =>
      isSameDesktop(windowDesktop, desktop),
    );
  }

  export function canRefocusWindow(
    window: KWinWindow | null,
    desktop: KWinVirtualDesktop | null,
  ): window is KWinWindow {
    if (window === null) {
      return false;
    }

    return (
      window.managed &&
      !window.deleted &&
      !window.hidden &&
      !window.inputMethod &&
      !window.minimized &&
      !window.specialWindow &&
      window.wantsInput &&
      isWindowOnDesktop(window, desktop)
    );
  }

  export function createRefocusTarget(
    window: KWinWindow | null,
    desktop: KWinVirtualDesktop | null,
  ): RefocusTarget | null {
    if (!canRefocusWindow(window, desktop) || desktop === null) {
      return null;
    }

    return { desktop, window };
  }

  export function canRestoreRefocusTarget(
    target: RefocusTarget,
    currentDesktop: KWinVirtualDesktop | null,
  ): boolean {
    return (
      isSameDesktop(currentDesktop, target.desktop) &&
      canRefocusWindow(target.window, target.desktop)
    );
  }

  export function recoverImeFocus(workspace: KWinWorkspace): void {
    const target = createRefocusTarget(
      workspace.activeWindow,
      workspace.currentDesktop,
    );

    if (target === null) {
      return;
    }

    workspace.activeWindow = null;

    if (canRestoreRefocusTarget(target, workspace.currentDesktop)) {
      workspace.activeWindow = target.window;
    }
  }
}
