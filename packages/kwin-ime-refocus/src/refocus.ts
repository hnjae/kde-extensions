// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: consumed by main.ts after script concatenation.
namespace KWinImeRefocus {
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

  export function recoverImeFocus(workspace: KWinWorkspace): void {
    const originalWindow = workspace.activeWindow;
    const originalDesktop = workspace.currentDesktop;

    if (!canRefocusWindow(originalWindow, originalDesktop)) {
      return;
    }

    workspace.activeWindow = null;

    if (!isSameDesktop(workspace.currentDesktop, originalDesktop)) {
      return;
    }

    if (!canRefocusWindow(originalWindow, originalDesktop)) {
      return;
    }

    workspace.activeWindow = originalWindow;
  }
}
