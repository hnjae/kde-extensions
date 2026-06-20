# Numbered Task Manager Overview

Numbered Task Manager is an icons-and-text Plasma task manager for users who select windows with `Meta+1` through `Meta+9` and the final item in the visible item order with `Meta+0`.

## Goals

- Each visible slot from 1 through 9 has a stable number that matches the corresponding `Meta+number` shortcut.
- The final item in the visible item order is reachable with `Meta+0` without showing a `0` number badge.
- Pinned applications keep their positions, so the same shortcut keeps targeting the same slot as windows open and close.
- Each window is shown as its own task item. Windows are not grouped together.
- A window demanding attention on another virtual desktop is visible and reachable from the current desktop without renumbering the normal task slots.

## Out Of Scope For v1

- A settings UI.
- Direct integration with KDE's notification service.
- Migration from KDE's existing task manager launcher list.
- Grouped application tasks.
- Exact feature parity with KDE's default task manager settings.
