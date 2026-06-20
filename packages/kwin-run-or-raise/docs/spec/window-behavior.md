# KWin Run or Raise Window Behavior

## Matching Windows

- A window matches when it belongs to the application assigned to the pressed shortcut.
- Regular application windows and user-facing dialogs for that application are considered. Panels, desktop backgrounds, menus, tooltips, notifications, splash screens, and similar temporary windows are ignored.
- Only windows in the current virtual desktop and current Activity are considered.
- A window shown on all virtual desktops is considered to be on the current virtual desktop.
- A window shown on all Activities is considered to be in the current Activity.
- In this specification, a visible window is a non-minimized window that KWin treats as present in the current virtual desktop and current Activity. A visible window may still be covered by other windows on the screen.
- When focused-window cycling does not apply, if several visible matching windows exist in the current virtual desktop and current Activity, the frontmost matching window is chosen.
- When focused-window cycling does not apply, if no matching window is visible, but one or more minimized matching windows exist in the current virtual desktop and current Activity, the most recently used matching window is chosen.

## Cycling Focused Windows

- When the focused window is a matching window for the application assigned to the pressed shortcut, the shortcut cycles through matching windows in the current virtual desktop and current Activity.
- If the focused window belongs to the application but is ignored by the matching rules, focused-window cycling does not apply; the shortcut continues with the normal matching rules for non-ignored windows instead.
- Cycling candidates include both visible and minimized matching windows.
- If more than one matching window exists, the next matching window follows KDE's Task Switcher order for windows of the current application, restricted to the current virtual desktop and current Activity. The cycle repeats when the user presses the shortcut again.
- If the chosen next window is minimized, it is restored before receiving focus.
- If only one matching window exists, pressing the shortcut leaves that window focused and does not launch the application.

## Bringing A Window Forward

When a matching window is found:

1. If the window is minimized, it is restored.
2. The window is brought in front of other windows.
3. The window receives keyboard focus.

- The current virtual desktop does not change.
- No window is moved from another virtual desktop to the current virtual desktop.
- No window is moved from another Activity to the current Activity.

## Launching An Application

- When no matching window is found in the current virtual desktop and current Activity, KDE handles it the same way it handles launching the assigned application from KDE's application launcher.
- This does not guarantee that a new window will appear. A single-instance application may reuse an existing process or window, and the application or the user's KDE settings may choose where the resulting window appears.
