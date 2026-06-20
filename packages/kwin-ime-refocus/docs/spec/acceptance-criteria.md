# KWin IME Refocus Acceptance Criteria

- When an application window is active, pressing the recovery shortcut immediately starts a focus reset for that window.
- After a recovery attempt, the original window is focused again when it is still available on the current virtual desktop.
- Pressing the recovery shortcut while no window is active does not cause an unexpected window switch.
- If the original window is no longer available, recovery does not select a replacement application window.
- A recovery attempt does not send text insertion, deletion, or editing input to applications.
- A recovery attempt does not request changes to the IME mode, keyboard layout, input method settings, application settings, window geometry, or virtual desktop.
