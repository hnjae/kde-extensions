# Numbered Task Manager Specification

Numbered Task Manager is an icons-and-text Plasma task manager for users who
select windows with `Meta+1` through `Meta+9`.

## Goals

- Each visible slot from 1 through 9 has a stable number that matches the
  corresponding `Meta+number` shortcut.
- Pinned applications keep their positions, so the same shortcut keeps targeting
  the same slot as windows open and close.
- Each window is shown as its own task item. Windows are not grouped together.

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
- Activating a launcher starts the application.
- Activating a window raises that window.
- The shortcut target is based on the visible task slot, not on the most
  recently opened or most recently active application.

## Out Of Scope For v1

- A settings UI.
- Migration from KDE's existing task manager launcher list.
- Grouped application tasks.
- Exact feature parity with KDE's default task manager settings.
