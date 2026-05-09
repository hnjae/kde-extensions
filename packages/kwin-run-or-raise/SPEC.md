<!--
SPDX-FileCopyrightText: 2026 hnjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# KWin Run or Raise Specification

KWin Run or Raise is a KWin extension for binding global shortcuts to
application-specific run-or-raise actions.

For each configured shortcut, the extension searches for a matching application
window on the current virtual desktop. If a matching window exists, it is raised
and focused. If no matching window exists on the current virtual desktop, the
configured desktop entry is launched.

## Example

A user configures `Meta+W` for `firefox.desktop`.

When `Meta+W` is pressed:

1. If a Firefox window exists on the current virtual desktop, that window is
   unminimized if necessary, raised, and focused.
2. If no Firefox window exists on the current virtual desktop, `firefox.desktop`
   is launched.
3. Firefox windows on other virtual desktops are ignored.

## Package

The package id is `kwin-run-or-raise`.

The user-facing name is `Run or Raise`.

The package is implemented as a KWin Script because KWin owns the window list,
virtual desktop state, window activation, and global shortcuts needed by this
feature.

## Bindings

Each binding has:

- a global shortcut
- a desktop entry id, such as `firefox.desktop` or `org.kde.konsole.desktop`
- optional match hints for applications whose window metadata does not map
  cleanly to the desktop entry id

The initial version may define bindings statically in the script package.
Configuration UI and dynamic editing are not required for the initial version.

## Window Matching

A window matches a binding when it belongs to the configured desktop entry.

The primary match key is the KWin window `desktopFileName` property, normalized
against the configured desktop entry id without the `.desktop` suffix.

Fallback matching may use window metadata such as `resourceClass` for
applications that do not expose a useful `desktopFileName`.

Only normal application windows are candidates. Desktop windows, panels, menus,
tooltips, notifications, splash screens, and other special-purpose windows are
ignored.

Only windows on the current virtual desktop are candidates. Windows shown on all
virtual desktops are considered candidates because they are visible on the
current virtual desktop.

If multiple matching windows exist on the current virtual desktop, the extension
raises the topmost matching window according to KWin stacking order.

## Raise Behavior

When a matching window is found, the extension:

1. clears the minimized state if the window is minimized
2. raises the window
3. focuses the window

The action must not move a window from another virtual desktop to the current
virtual desktop.

The action must not switch to another virtual desktop.

## Launch Behavior

When no matching window is found on the current virtual desktop, the extension
launches the configured desktop entry.

The launch path should preserve the semantics of KDE application launching, so
desktop entry metadata such as `Exec`, `StartupNotify`, `Terminal`, and icon
metadata are respected.

If KWin Script APIs cannot launch desktop entries directly, the package may use a
small helper process or D-Bus service that resolves desktop entries through KDE
Frameworks and starts them through the standard KDE application launcher APIs.

Launch failures should be logged for debugging.

## Non-Goals

The initial version does not need to:

- search across all virtual desktops
- move windows between virtual desktops
- cycle through every window of an application
- support per-activity behavior beyond KWin's current visible window state
- provide migrations or backward compatibility for configuration formats
- replace KDE's task manager, application launcher, or KRunner behavior

## Testing

The implementation should be testable with at least:

- a unit-testable window selection function that receives window-like data and
  returns the selected candidate
- manual KWin Script testing from the Plasma interactive KWin console
- an installed-package smoke test that verifies a shortcut can raise an existing
  window and launch the desktop entry when no matching window exists
