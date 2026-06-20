# KWin Run or Raise Overview

KWin Run or Raise lets the user assign global shortcuts to applications.

When the user presses a configured shortcut, KWin Run or Raise brings the matching application to the front, cycles to another matching window, or launches the application through KDE's application launcher.

## Example

A user assigns `Meta+W` to Firefox.

When `Meta+W` is pressed:

1. If Firefox is already focused and multiple Firefox windows exist in the current virtual desktop and current Activity, focus moves to the next Firefox window.
2. If Firefox is already focused and only one Firefox window exists in the current virtual desktop and current Activity, nothing changes.
3. If a Firefox window is visible in the current virtual desktop and current Activity, that window is raised and focused.
4. If only minimized Firefox windows exist in the current virtual desktop and current Activity, the most recently used Firefox window is restored, raised, and focused.
5. If no Firefox window exists in the current virtual desktop and current Activity, Firefox is launched through KDE's application launcher.
6. Firefox windows on other virtual desktops or other Activities are ignored.

## Out Of Scope

The extension does not:

- switch to another virtual desktop to find an existing window
- switch to another Activity to find an existing window
- move windows between virtual desktops
- move windows between Activities
- cycle through windows outside the current virtual desktop and current Activity
- replace KDE's task manager, application launcher, or KRunner
