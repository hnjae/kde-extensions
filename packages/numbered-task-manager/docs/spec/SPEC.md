# Numbered Task Manager Specification

Numbered Task Manager is an icons-and-text Plasma task manager for users who
select windows with `Meta+1` through `Meta+9` and the final item in the visible
item order with `Meta+0`.

## Goals

- Each visible slot from 1 through 9 has a stable number that matches the
  corresponding `Meta+number` shortcut.
- The final item in the visible item order is reachable with `Meta+0` without
  showing a `0` number badge.
- Pinned applications keep their positions, so the same shortcut keeps targeting
  the same slot as windows open and close.
- Each window is shown as its own task item. Windows are not grouped together.
- A window demanding attention on another virtual desktop is visible and
  reachable from the current desktop without renumbering the normal task slots.

## Task List Behavior

- The widget uses an icons-and-text task item layout and follows KDE task
  manager interaction patterns unless this spec says otherwise.
- Task backgrounds and state indicators follow the active Plasma task-manager theme for normal, hover, active, minimized, demanding-attention, and drag-drop target states.
- Task backgrounds fill the panel cross-axis: the available height in horizontal panels and the available width in vertical panels.
- Adjacent task backgrounds do not add a fixed layout gap beyond the active Plasma task-manager theme geometry.
- Task icon size follows KDE Plasma 6.6's default icons-and-text task manager behavior for the same panel size and active Plasma theme.
- The active window uses the Plasma task-manager active background state, but its icon is not rendered with the hover-active icon appearance unless the task itself is highlighted by hover, keyboard focus, or an open task menu.
- The first nine normal visible task slots are numbered `1` through `9`.
- Normal tasks after slot 9 remain visible but are not numbered.
- In supported normal horizontal panel sizes, the expected number style is a badge over the lower-left corner of the task icon.
- Number badges use KDE's configured fixed-width font.
- If the task icon is too small for a readable badge, the number is shown as an accessibility fallback text prefix before the icon and title instead.
- The normal task list shows tasks from the current virtual desktop.
- The widget is not limited to the current screen.
- Activity filtering follows KDE's task manager behavior. Empty activity lists
  and KDE's null activity UUID both mean "all activities".
- Horizontal panels are the supported v1 target. Vertical panels may work, but
  they are best-effort in v1.

## Context Menu Behavior

- Right-clicking a task opens that task's context menu, using a Plasma-native menu positioned outside the panel bounds.
- Pressing the keyboard Menu key while a task has focus opens the same task context menu.
- Right-clicking empty widget space or panel space continues to use Plasma's normal applet or panel context menu.
- Task actions appear before any widget configuration or panel edit actions.
- Configure and edit-mode actions may appear in the task context menu only as footer actions after task actions.

## Pinned Applications

- A new widget starts with no pinned applications.
- Users can pin and unpin applications from the task context menu.
- Launcher activity menu changes only affect where a pinned launcher appears.
  They do not unpin or delete the launcher.
- Pinned applications form a continuous pinned area at the start of the normal
  task list.
- Users can reorder pinned applications by dragging them within the pinned area.
- Unpinned windows appear after the pinned area and can be reordered by dragging
  them within the unpinned area.
- Dragging cannot move an item across the pinned/unpinned boundary. Drops across
  the boundary are ignored and do not pin, unpin, or reorder the item.
- A pinned application appears as a launcher icon when it has no matching window
  in the normal task list.
- Activating a pinned launcher opens the application in that pinned slot instead
  of creating the first matching window at the far right.
- If a pinned application already has a window in its pinned slot, opening
  another window from the same application keeps the existing pinned-slot window
  in place and adds the new window after the pinned area.
- When the window in a pinned slot closes, Plasma's TasksModel launcher/window
  matching decides whether another same-application window refills that slot or
  the slot returns to the pinned launcher.
- The widget preserves the relative visible order of remaining unpinned
  windows, but refill selection is not guaranteed to follow manually reordered
  unpinned order.

## Activation Behavior

- `Meta+1` through `Meta+9` activate the task in the matching numbered slot.
- `Meta+0` activates the final item in the visible item order. It is based on
  item order, not on a numbered slot or on pixel clipping, and it does nothing
  when there is no visible item.
- Plasma delivers this behavior through the global shortcut action named
  `Activate Task Manager Entry 10`.
- If the `Meta+0` target is also one of slots `1` through `9`, both shortcuts
  activate the same item.
- `Meta+0` is intentionally unbadged. Users identify its target by the final
  item position, not by a number label.
- Activating a launcher starts the application.
- Activating a window focuses and raises that window, restoring it if minimized.
- `Meta+1` through `Meta+9` targets are based on visible task slots, not on the
  most recently opened or most recently active application.

## Remote Attention Behavior

- Remote attention means a window within KDE task manager's current activity
  scope, on another virtual desktop, that asks for attention.
- Remote attention tasks do not enter the normal `1` through `9` task slot
  order and do not change existing slot numbers.
- When at least one remote attention task exists, the widget shows one distinct
  attention item at the far right of the widget.
- The remote attention item uses the same Plasma task-manager attention styling as a demanding-attention task.
- The attention item is the `Meta+0` target because it is the final item in the
  visible item order, not because remote attention has a dedicated shortcut.
- The attention item does not show a `0` number badge.
- The attention item is separate from the normal task slots and does not move
  existing slots.
- Activating the attention item switches to the task's virtual desktop and
  raises the window.
- If multiple remote attention tasks exist, the attention item shows a count and
  targets the window most recently observed entering the demanding-attention
  state. Windows already demanding attention when the widget starts fall back to
  task model order until a later attention transition is observed.
- Remote attention is not limited to the current screen. Its activity scope
  follows KDE's task manager behavior.

## Out Of Scope For v1

- A settings UI.
- Direct integration with KDE's notification service.
- Migration from KDE's existing task manager launcher list.
- Grouped application tasks.
- Exact feature parity with KDE's default task manager settings.
