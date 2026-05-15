# kwin-ime-refocus

`kwin-ime-refocus` is a KWin script for KDE Plasma Wayland.

Its purpose is to provide a manual workaround for cases where IME input stops working because the Wayland text input protocol does not connect correctly.

When the user triggers the configured shortcut, the script remembers the currently active window, briefly clears focus, and then restores focus to the original window. This lets the user try to recover IME input immediately without manually switching away from the current window and back again.

This program does not permanently fix the underlying KDE Plasma or Wayland text input issue. It only provides an on-demand recovery action until the upstream issue is fixed.
