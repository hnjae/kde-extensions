# Numbered Task Manager Context Menu

- Right-clicking a task opens that task's context menu, using a Plasma-native menu positioned outside the panel bounds.
- Pressing the keyboard Menu key while a task has focus opens the same task context menu.
- Right-clicking empty widget space or panel space continues to use Plasma's normal applet or panel context menu.
- Application `.desktop` actions appear at the top of the task context menu when the task has a launcher URL with visible desktop actions.
- Window tasks show a Move to Desktop submenu when the window can change virtual desktops.
- Window-management actions such as Move, Resize, Maximize, Minimize, Keep Above, Keep Below, Fullscreen, No Titlebar and Frame, Hide from Screencast, and grouping are collected under a More submenu when applicable.
- Task actions appear before any widget configuration or panel edit actions.
- Configure and edit-mode actions may appear in the task context menu only as footer actions after task actions.
- Unavailable configure and edit-mode footer actions are hidden, and failed footer action triggers are reported as action diagnostics.
- Close appears as the terminal task action after footer actions when the task can be closed.
