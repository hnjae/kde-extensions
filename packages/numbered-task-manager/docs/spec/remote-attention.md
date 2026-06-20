# Numbered Task Manager Remote Attention

- Remote attention means a window within KDE task manager's current activity scope, on another virtual desktop, that asks for attention.
- Remote attention tasks do not enter the normal `1` through `9` task slot order and do not change existing slot numbers.
- When at least one remote attention task exists, the widget shows one distinct attention item at the far right of the widget.
- The remote attention item uses the same Plasma task-manager attention styling as a demanding-attention task.
- The remote attention item participates in the same horizontal adaptive slot sizing as normal task items when it is visible.
- The attention item is the `Meta+0` target because it is the final item in the visible item order, not because remote attention has a dedicated shortcut.
- The attention item does not show a `0` number badge.
- The attention item is separate from the normal task slots and does not move existing slots.
- Activating the attention item switches to the task's virtual desktop and raises the window.
- If multiple remote attention tasks exist, the attention item shows a count and targets the window most recently observed entering the demanding-attention state. Windows already demanding attention when the widget starts fall back to task model order until a later attention transition is observed.
- Remote attention is not limited to the current screen. Its activity scope follows KDE's task manager behavior.
