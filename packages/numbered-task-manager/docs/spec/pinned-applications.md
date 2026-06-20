# Numbered Task Manager Pinned Applications

- A new widget starts with no pinned applications.
- Users can pin and unpin applications from the task context menu.
- The Pin/Unpin task context menu action reflects whether the task's launcher URL is pinned in this widget for the current activity, not whether KDE can associate the task with any launcher.
- Pin and unpin only count as successful after launcher-list persistence succeeds; if persistence fails, the action reports a failure instead of silently succeeding.
- Launcher activity menu changes only affect where a pinned launcher appears. They do not unpin or delete the launcher.
- Pinned applications form a continuous pinned area at the start of the normal task list.
- Users can reorder pinned applications by dragging them within the pinned area.
- Unpinned windows appear after the pinned area and can be reordered by dragging them within the unpinned area.
- Dragging cannot move an item across the pinned/unpinned boundary. Drops across the boundary are ignored and do not pin, unpin, or reorder the item.
- A pinned application appears as a launcher icon when it has no matching window in the normal task list.
- A pinned launcher with no matching window shows only its slot number and icon; its text label is hidden.
- A pinned launcher with no matching window is aligned to the start of its slot instead of centered.
- A pinned launcher with no matching window uses a muted clickable background that is less prominent than an inactive window task and becomes fully highlighted for hover, keyboard focus, an open menu, or drag-drop target feedback.
- A pinned launcher with no matching window participates in the same horizontal adaptive slot sizing as normal window tasks.
- Activating a pinned launcher opens the application in that pinned slot instead of creating the first matching window at the far right.
- If a pinned application already has a window in its pinned slot, opening another window from the same application keeps the existing pinned-slot window in place and adds the new window after the pinned area.
- When the window in a pinned slot closes, Plasma's TasksModel launcher/window matching decides whether another same-application window refills that slot or the slot returns to the pinned launcher.
- The widget preserves the relative visible order of remaining unpinned windows, but refill selection is not guaranteed to follow manually reordered unpinned order.
