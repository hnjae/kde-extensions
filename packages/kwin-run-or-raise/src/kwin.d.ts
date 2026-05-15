// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

type KWinSignal<T extends (...args: never[]) => void> = {
  connect(callback: T): void;
};

type KWinDesktop = {
  id?: string;
  name?: string;
};

type KWinWindow = {
  activities?: string[];
  deleted?: boolean;
  desktopFileName?: string;
  desktops?: KWinDesktop[];
  dialog?: boolean;
  hidden?: boolean;
  inputMethod?: boolean;
  managed?: boolean;
  minimized?: boolean;
  normalWindow?: boolean;
  onAllDesktops?: boolean;
  wantsInput?: boolean;
};

type KWinWorkspace = {
  activeWindow: KWinWindow | null;
  currentActivity?: string;
  currentDesktop?: KWinDesktop;
  stackingOrder?: KWinWindow[];
  windowActivated?: KWinSignal<(window: KWinWindow | null) => void>;
  windowList?: () => KWinWindow[];
  windowRemoved?: KWinSignal<(window: KWinWindow) => void>;
  windows?: KWinWindow[];

  raiseWindow(window: KWinWindow): void;
};

declare const workspace: KWinWorkspace;

declare function callDBus(
  service: string,
  path: string,
  dbusInterface: string,
  method: string,
  ...args: unknown[]
): void;

declare function print(message: string): void;

declare function readConfig(
  key: string,
  defaultValue?: boolean | string,
): boolean | string | number | null | undefined;

declare function registerShortcut(
  actionName: string,
  text: string,
  keySequence: string,
  callback: () => void,
): void;
