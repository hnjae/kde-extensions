# Numbered Task Manager

A Plasma 6 task manager plasmoid for keyboard-friendly window selection.

Numbered Task Manager is an icons-and-text task manager that keeps the visible
task order aligned with `Meta+1` through `Meta+9`. The first nine normal tasks
show number badges, later tasks remain visible without badges, and `Meta+0`
activates the final visible item.

Plasma delivers `Meta+0` through the global shortcut action named
`Activate Task Manager Entry 10`. If that action has no shortcut on the target
system, bind it to `Meta+0` in Plasma's shortcut settings.

## Implemented v1 behavior

- Current-virtual-desktop task list using KDE Plasma's `org.kde.taskmanager`
  model.
- Per-window task items with grouping disabled and screen filtering disabled.
- Pinned launcher persistence, pin/unpin context actions, launch-in-place, and
  drag reordering within the pinned or unpinned area.
- Cross-boundary drops between pinned and unpinned tasks are ignored.
- A far-right remote-attention item for demanding-attention windows on another
  virtual desktop. It stays outside the numbered task order and becomes the
  `Meta+0` target while visible.

## Development checks

```sh
just lint-qml
just check
just build
```

Manual Plasma verification is still required for shortcut delivery,
launch-in-place behavior, drag/drop ordering, and remote-attention activation.
