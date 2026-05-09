<!--
SPDX-FileCopyrightText: 2026 hnjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# KWin Run or Raise Specification

KWin Run or Raise lets the user assign global shortcuts to applications.

When the user presses a configured shortcut, the matching application is either
brought to the front or launched.

## Example

A user assigns `Meta+W` to Firefox.

When `Meta+W` is pressed:

1. If a Firefox window exists on the current virtual desktop, that window is
   unminimized if necessary, raised, and focused.
2. If no Firefox window exists on the current virtual desktop, Firefox is
   launched.
3. Firefox windows on other virtual desktops are ignored.

## Bindings

Each binding pairs one global shortcut with one application.

The same application may have more than one binding.

Different applications may use different shortcuts.

Pressing a binding never launches a second copy of the application when a
matching window is already present on the current virtual desktop.

## Matching Windows

A window matches when it belongs to the application assigned to the pressed
shortcut.

Only regular application windows are considered. Panels, desktop backgrounds,
menus, tooltips, notifications, splash screens, and similar temporary windows are
ignored.

Only windows on the current virtual desktop are considered.

A window shown on all virtual desktops is considered to be on the current virtual
desktop.

If several matching windows exist on the current virtual desktop, the frontmost
matching window is chosen.

## Bringing A Window Forward

When a matching window is found:

1. If the window is minimized, it is restored.
2. The window is brought in front of other windows.
3. The window receives keyboard focus.

The current virtual desktop does not change.

No window is moved from another virtual desktop to the current virtual desktop.

## Launching An Application

When no matching window is found on the current virtual desktop, the assigned
application is launched in the same way it would be launched from KDE's
application launcher.

The newly launched application opens on the current virtual desktop unless the
application or the user's KDE settings choose otherwise.

## Out Of Scope

The extension does not:

- switch to another virtual desktop to find an existing window
- move windows between virtual desktops
- cycle through all windows of an application
- replace KDE's task manager, application launcher, or KRunner
