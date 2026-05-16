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
  current activity.
- Horizontal panels are the supported v1 target. Vertical panels may work, but
  they are best-effort in v1.

## Pinned Applications

- A new widget starts with no pinned applications.
- Users can pin and unpin applications from the task context menu.
- Users can reorder task slots by dragging them.
- A pinned application appears as a launcher icon when it has no matching
  window.
- Activating a pinned launcher opens the application in that pinned slot instead
  of creating a new task at the far right.
- If a pinned application has multiple windows, one matching window occupies the
  pinned slot and the extra windows appear after the pinned area.
- When the window in a pinned slot closes, another window from the same
  application refills that slot if one exists. Otherwise, the slot returns to the
  pinned launcher.

## Activation Behavior

- `Meta+1` through `Meta+9` activate the task in the matching numbered slot.
- `Meta+0` activates the current remote attention task when one exists.
- Activating a launcher starts the application.
- Activating a window raises that window.
- The shortcut target is based on the visible task slot, not on the most
  recently opened or most recently active application.

## Remote Attention Behavior

- Remote attention means a task manager window task on another virtual desktop
  that reports KDE's demanding-attention state.
- Remote attention tasks do not enter the normal `1` through `9` task slot
  order and do not change existing slot numbers.
- When at least one remote attention task exists, the widget shows one distinct
  attention item with a `0` badge.
- Activating the attention item, including with `Meta+0`, switches to the
  task's virtual desktop and raises the window.
- If multiple remote attention tasks exist, the attention item shows a count and
  targets the most recently observed remote attention task.
- Remote attention handling is limited to tasks that otherwise match the
  widget's current screen and current activity scope.

## Out Of Scope For v1

- A settings UI.
- Direct integration with KDE's notification service.
- Migration from KDE's existing task manager launcher list.
- Grouped application tasks.
- Exact feature parity with KDE's default task manager settings.
