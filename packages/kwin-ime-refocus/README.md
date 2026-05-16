# kwin-ime-refocus

`kwin-ime-refocus` is a KWin script for KDE Plasma Wayland.

Its purpose is to provide a manual workaround for cases where IME input stops working because the Wayland text input protocol does not connect correctly.

When the user triggers the configured shortcut, the script remembers the currently active window, briefly clears focus, and then restores focus to the original window. This lets the user try to recover IME input immediately without manually switching away from the current window and back again.

This program does not permanently fix the underlying KDE Plasma or Wayland text input issue. It only provides an on-demand recovery action until the upstream issue is fixed.

## Usage

Install and enable the KWin script in KDE Plasma:

1. Open System Settings.
2. Go to Window Management > KWin Scripts.
3. Enable `IME Refocus`.

Then assign the recovery shortcut:

1. Open System Settings.
2. Go to Keyboard > Shortcuts > Window Management.
3. Find the `IME Refocus` action.
4. Assign the shortcut you want to use.

The shortcut is configured from the Shortcuts page, not from the KWin Scripts page.

The action is intentionally unbound by default. If no shortcut is configured, keyboard input will not trigger recovery.

Recovery only targets the window that was active when the shortcut was pressed. It does not switch virtual desktops, choose a fallback window, send text input, or change IME, keyboard layout, application, or window geometry settings.
