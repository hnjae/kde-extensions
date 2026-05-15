// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

interface KWinVirtualDesktop {
  readonly id: string;
}

interface KWinWindow {
  readonly active: boolean;
  readonly deleted: boolean;
  readonly desktops: readonly KWinVirtualDesktop[];
  readonly hidden: boolean;
  readonly inputMethod: boolean;
  readonly managed: boolean;
  readonly normalWindow: boolean;
  readonly onAllDesktops: boolean;
  readonly specialWindow: boolean;
  readonly wantsInput: boolean;
  minimized: boolean;
}

interface KWinWorkspace {
  activeWindow: KWinWindow | null;
  readonly currentDesktop: KWinVirtualDesktop | null;
}

declare const workspace: KWinWorkspace;

declare function registerShortcut(
  title: string,
  text: string,
  keySequence: string,
  callback: () => void,
): boolean;
