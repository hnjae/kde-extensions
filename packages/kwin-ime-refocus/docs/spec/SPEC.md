# SPEC

## Purpose

This program lets the user manually reset focus for the currently active window in a KDE Plasma Wayland session, by pressing a configured recovery shortcut, to try to make the IME attach to that window again.

## User Scenarios

### IME Input Recovery

1. The user uses applications normally in a Wayland session.
2. The user encounters an active window where IME input no longer behaves as expected.
3. The user presses the configured recovery shortcut.
4. The active window briefly loses focus.
5. The program tries to focus the same window again.
6. If the same window can still be focused on the current virtual desktop, the user is returned to that window.
7. If the focus reset makes the IME attach to the window again, IME input follows the user's currently selected input state.
8. If the IME problem remains, no additional recovery action is performed.

### Returning to the Original Window

1. The window that was active when the recovery shortcut was pressed is the only application window the recovery action tries to focus.
2. Recovery does not switch the user's current virtual desktop to find or focus the original window.
3. The original window is considered available only when it can still be focused without switching virtual desktops.
4. If the original window can no longer be focused, recovery ends without selecting a replacement application window on the user's behalf.

### No Focused Window

1. If there is no active window when the recovery shortcut is pressed, the user does not experience a window switch.
2. No application window is selected on the user's behalf.

### Recovery Shortcut

1. The recovery action is exposed as a KDE shortcut whose user-visible name identifies it as an IME refocus or IME recovery action.
2. If no recovery shortcut is configured, keyboard input does not trigger recovery.

## User-Visible Behavior

- The recovery shortcut only acts when the user presses it directly.
- Recovery is a best-effort focus reset, not a guaranteed IME fix.
- During recovery, the active window briefly loses focus.
- After recovery, the user should be back in the window that was active before pressing the recovery shortcut, when that window is still available on the current virtual desktop.
- Recovery has no fallback application window target.
- Recovery does not send text insertion, deletion, or editing input to applications.
- Because the active window loses focus, the application or IME may handle an unfinished text composition according to its own focus behavior.
- Recovery does not request changes to the IME input mode, keyboard layout, input method settings, or application settings.
- Recovery does not close, minimize, move, or resize application windows.
- Recovery does not switch virtual desktops.

## Non-Goals

- This program does not permanently fix the underlying IME bug.
- This program does not guarantee IME input recovery in every application.
- This program does not automatically change focus when the user has not pressed the recovery shortcut.
- This program does not recover IME input by changing the user's keyboard layout, input method settings, or application settings.
- This program does not preserve or restore an unfinished IME composition that an application or input method changes during focus loss.

## Acceptance Criteria

- When an application window is active, pressing the recovery shortcut immediately starts a focus reset for that window.
- After a recovery attempt, the original window is focused again when it is still available on the current virtual desktop.
- Pressing the recovery shortcut while no window is active does not cause an unexpected window switch.
- If the original window is no longer available, recovery does not select a replacement application window.
- A recovery attempt does not send text insertion, deletion, or editing input to applications.
- A recovery attempt does not request changes to the IME mode, keyboard layout, input method settings, application settings, window geometry, or virtual desktop.
