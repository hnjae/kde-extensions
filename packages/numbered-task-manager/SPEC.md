# Numbered Task Manager Specification

Numbered Task Manager is an icons-and-text Plasma task manager for users who
select windows with `Meta+1` through `Meta+9`.

## Goals

- Each visible slot from 1 through 9 has a stable number that matches the
  corresponding `Meta+number` shortcut.
- Pinned applications keep their positions, so the same shortcut keeps targeting
  the same slot as windows open and close.
- Each window is shown as its own task item. Windows are not grouped together.
- A window demanding attention on another virtual desktop is visible and
  reachable from the current desktop without renumbering the normal task slots.

## Task List Behavior

- The widget looks and behaves like an icons-and-text task manager.
- The first nine visible task slots are numbered `1` through `9`.
- Tasks after slot 9 remain visible but are not numbered.
- The default number style is a badge over the lower-left corner of the task
  icon.
- Number badges use KDE's configured fixed-width font.
- If the task icon is too small for a readable badge, the number is shown as a
  text prefix before the icon and title instead.
- The widget shows tasks from the current virtual desktop, current screen, and
  current activity, except for the separate remote attention item described
  below.
- Horizontal panels are the supported v1 target. Vertical panels may work, but
  they are best-effort in v1.

## Pinned Applications

- A new widget starts with no pinned applications.
- Users can pin and unpin applications from the task context menu.
- Pinned applications form a continuous pinned area at the start of the normal
  task list.
- Users can reorder pinned applications by dragging them within the pinned area.
- Unpinned windows appear after the pinned area.
- A pinned application appears as a launcher icon when it has no matching
  window.
- Activating a pinned launcher opens the application in that pinned slot instead
  of creating the first matching window at the far right.
- If a pinned application already has a window in its pinned slot, opening
  another window from the same application keeps the existing pinned-slot window
  in place and adds the new window after the pinned area.
- When the window in a pinned slot closes, another window from the same
  application refills that slot if one exists. Otherwise, the slot returns to the
  pinned launcher.

## Activation Behavior

- `Meta+1` through `Meta+9` activate the task in the matching numbered slot.
- `Meta+0` activates the remote attention item when one exists. It never
  activates the tenth task, and it does nothing when no remote attention item
  exists.
- Activating a launcher starts the application.
- Activating a window focuses and raises that window, restoring it if minimized.
- The shortcut target is based on the visible task slot, not on the most
  recently opened or most recently active application.

## Remote Attention Behavior

- Remote attention means a window on another virtual desktop that asks for
  attention.
- Remote attention tasks do not enter the normal `1` through `9` task slot
  order and do not change existing slot numbers.
- When at least one remote attention task exists, the widget shows one distinct
  attention item with a `0` badge at the far right of the widget.
- The attention item is separate from the normal task slots and does not move
  existing slots.
- Activating the attention item, including with `Meta+0`, switches to the
  task's virtual desktop and raises the window.
- If multiple remote attention tasks exist, the attention item shows a count and
  targets the window that most recently started asking for attention.
- Remote attention handling is limited to tasks that otherwise match the
  widget's current screen and current activity scope.

## Out Of Scope For v1

- A settings UI.
- Direct integration with KDE's notification service.
- Migration from KDE's existing task manager launcher list.
- Grouped application tasks.
- Exact feature parity with KDE's default task manager settings.
