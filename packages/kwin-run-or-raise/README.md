<!--
SPDX-FileCopyrightText: 2026 KIM Hyunjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# KWin Run or Raise

KWin Run or Raise is a KWin script that binds global shortcuts to applications.
Pressing a configured shortcut raises a matching window on the current virtual
desktop and current Activity, cycles matching windows when one is already
focused, restores a minimized match, or launches the application through KDE.

## Build & Install

Build the KWin KPackage archive from this package directory:

```sh
just build-kpackage

# or

nix develop 'path:../..#kwin-run-or-raise' -c build-kpackage
```

The archive is written to `dist/kwin-run-or-raise-0.1.0.kwinscript`.

Install it from KDE System Settings with Window Management > KWin Scripts >
Install from File, or install it from the command line:

```sh
kpackagetool6 --type=KWin/Script --install dist/kwin-run-or-raise-0.1.0.kwinscript
```

## Configuration

The script exposes 16 fixed binding slots in the KWin script configuration UI.
For each slot:

- Enable the slot.
- Set a display name, such as `Firefox`.
- Set the Desktop Entry ID, such as `firefox`, `firefox.desktop`, or
  `org.kde.konsole`.
- Set the default shortcut, such as `Meta+W`.

The action name registered with KDE is stable per slot, from
`RunOrRaiseBinding01` through `RunOrRaiseBinding16`. If two enabled slots use
the same non-empty default shortcut, only the earlier slot is registered and the
later slot is skipped with a KWin script log message.

## Matching

Window matching compares the configured Desktop Entry ID with KWin's
`desktopFileName` for each window. The script trims whitespace, takes the
basename, and removes a trailing `.desktop` before comparing.

Only regular application windows and dialogs are considered. Hidden windows,
deleted windows, input method windows, unmanaged windows, and windows that do
not want input are ignored.

Matching is limited to the current virtual desktop and current Activity. Windows
on other desktops or Activities are ignored. Windows shown on all desktops, or
with no specific desktop or Activity list, are treated as available in the
current scope.

## Behavior

When a shortcut is pressed:

1. If the active window is a matching candidate and more than one candidate
   exists, the script cycles to the next matching window.
2. If the active window is the only matching candidate, nothing changes.
3. If a visible matching window exists, the frontmost visible match is raised
   and focused.
4. If only minimized matching windows exist, the most recently used minimized
   match is restored, raised, and focused.
5. If no matching window exists in the current desktop and Activity, the script
   asks KDE's launcher to start the configured Desktop Entry ID.

Cycling uses the script's most-recently-used activation order. KWin does not
expose the task switcher ordering directly to scripts.
