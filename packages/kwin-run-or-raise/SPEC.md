<!--
SPDX-FileCopyrightText: 2026 hnjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# KWin Run or Raise Specification

KWin Run or Raise lets the user assign global shortcuts to applications.

When the user presses a configured shortcut, the matching application is brought
to the front, cycled to another matching window, or launched.

## Example

A user assigns `Meta+W` to Firefox.

When `Meta+W` is pressed:

1. If Firefox is already focused and multiple Firefox windows exist in the
   current virtual desktop and current Activity, focus moves to the next Firefox
   window.
2. If Firefox is already focused and only one Firefox window exists in the
   current virtual desktop and current Activity, nothing changes.
3. If a Firefox window is visible in the current virtual desktop and current
   Activity, that window is raised and focused.
4. If only minimized Firefox windows exist in the current virtual desktop and
   current Activity, the most recently used Firefox window is restored, raised,
   and focused.
5. If no Firefox window exists in the current virtual desktop and current
   Activity, Firefox is launched.
6. Firefox windows on other virtual desktops or other Activities are ignored.

## Bindings

Each binding pairs one global shortcut with one application.

Each shortcut may be assigned to only one application.

The same application may have more than one binding.

Different applications may use different shortcuts.

Pressing a binding never launches a second copy of the application when a
matching window is already present in the current virtual desktop and current
Activity.

## Matching Windows

A window matches when it belongs to the application assigned to the pressed
shortcut.

Regular application windows and user-facing dialogs for that application are
considered. Panels, desktop backgrounds, menus, tooltips, notifications, splash
screens, and similar temporary windows are ignored.

Only windows in the current virtual desktop and current Activity are considered.

A window shown on all virtual desktops is considered to be on the current virtual
desktop.

A window shown on all Activities is considered to be in the current Activity.

When focused-window cycling does not apply, if several visible matching windows
exist in the current virtual desktop and current Activity, the frontmost matching
window is chosen.

When focused-window cycling does not apply, if no matching window is visible,
but one or more minimized matching windows exist in the current virtual desktop
and current Activity, the most recently used matching window is chosen.

## Cycling Focused Windows

When the focused window already belongs to the application assigned to the
pressed shortcut, the shortcut cycles through matching windows in the current
virtual desktop and current Activity.

If more than one matching window exists, the next matching window follows KDE's
Task Switcher order for windows of the current application, restricted to the
current virtual desktop and current Activity. The cycle repeats when the user
presses the shortcut again.

If the chosen next window is minimized, it is restored before receiving focus.

If only one matching window exists, pressing the shortcut leaves that window
focused and does not launch the application.

## Bringing A Window Forward

When a matching window is found:

1. If the window is minimized, it is restored.
2. The window is brought in front of other windows.
3. The window receives keyboard focus.

The current virtual desktop does not change.

No window is moved from another virtual desktop to the current virtual desktop.

No window is moved from another Activity to the current Activity.

## Launching An Application

When no matching window is found in the current virtual desktop and current
Activity, the assigned application is launched in the same way it would be
launched from KDE's application launcher.

The newly launched application opens in the current virtual desktop and current
Activity unless the application or the user's KDE settings choose otherwise.

## Out Of Scope

The extension does not:

- switch to another virtual desktop to find an existing window
- switch to another Activity to find an existing window
- move windows between virtual desktops
- move windows between Activities
- cycle through windows outside the current virtual desktop and current Activity
- replace KDE's task manager, application launcher, or KRunner
