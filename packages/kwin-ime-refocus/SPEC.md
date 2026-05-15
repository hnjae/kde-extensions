# SPEC

## Purpose

This program lets the user immediately try to recover IME input in the currently focused window by pressing a configured key when IME input stops behaving correctly in a KDE Plasma Wayland session.

## User Scenarios

### IME Input Recovery

1. The user uses applications normally in a Wayland session.
2. The user encounters a window where IME input no longer behaves as expected.
3. The user presses the configured recovery key.
4. The window the user was working in briefly loses focus and then regains focus.
5. The user can continue typing in the same window.
6. If recovery succeeds, IME input behaves according to the currently selected input state again.

### Recovery Target Window

1. The window that has focus when the recovery key is pressed is the recovery target.
2. After recovery, the user should be back in the original window.
3. Recovery must not leave another window focused.
4. Recovery must not change the user's current virtual desktop.

### No Focused Window

1. If there is no active window when the recovery key is pressed, the user does not experience a window switch.
2. When there is no active window, no new window is selected and no existing window is forcibly activated.

## User-Visible Behavior

- The recovery key only acts when the user presses it directly.
- During recovery, the current window may very briefly lose focus.
- After recovery, the user should be able to continue working in the window that was active before pressing the recovery key.
- Recovery does not edit or delete text on behalf of the user.
- Recovery does not arbitrarily change the current IME input mode.
- Recovery does not close, minimize, move, or resize application windows.

## Non-Goals

- This program does not permanently fix the underlying IME bug.
- This program does not guarantee IME input recovery in every application.
- This program does not automatically change focus when the user has not pressed the recovery key.
- This program does not change the user's keyboard layout, input method settings, or application settings.

## Acceptance Criteria

- When the user decides IME input is broken, the user can press the recovery key to immediately try recovery.
- After a recovery attempt, the user can continue working in the original window.
- Pressing the recovery key while no window is active does not cause an unexpected window switch.
