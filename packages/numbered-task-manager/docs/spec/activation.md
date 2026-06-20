# Numbered Task Manager Activation

- `Meta+1` through `Meta+9` activate the task in the matching numbered slot.
- `Meta+0` activates the final item in the visible item order. It is based on item order, not on a numbered slot or on pixel clipping, and it does nothing when there is no visible item.
- Plasma delivers this behavior through the global shortcut action named `Activate Task Manager Entry 10`.
- If the `Meta+0` target is also one of slots `1` through `9`, both shortcuts activate the same item.
- `Meta+0` is intentionally unbadged. Users identify its target by the final item position, not by a number label.
- Activating a launcher starts the application.
- Activating a window focuses and raises that window, restoring it if minimized.
- `Meta+1` through `Meta+9` targets are based on visible task slots, not on the most recently opened or most recently active application.
