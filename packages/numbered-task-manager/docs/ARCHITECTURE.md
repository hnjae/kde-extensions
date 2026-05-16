# Numbered Task Manager Architecture

This document records implementation constraints for the user behavior described
in `SPEC.md`.

## Implementation Strategy

- Build on KDE Plasma's task manager APIs instead of implementing window
  discovery or activation from scratch.
- Use the Plasma Workspace `org.kde.taskmanager` QML module for task data and
  task actions.
- Use KDE's task manager private backend only where it is needed for normal task
  manager behavior such as launcher context actions, drag handling, and opening
  files with a task.
- Treat private KDE QML APIs as the main maintenance risk and keep the copied or
  adapted surface as small as practical.

## Model Policy

- Use manual task ordering so user drag order can define shortcut positions
  within the pinned prefix and within the unpinned suffix.
- Disable application grouping so each window has a separate task item.
- Keep pinned launchers and their in-place windows as a contiguous prefix of the
  normal visible model.
- Enable launch-in-place behavior so a matching window occupies its pinned
  launcher slot.
- Append unpinned windows and extra windows from pinned applications after the
  pinned prefix.
- Do not replace or move an existing pinned-slot window when an additional
  matching window appears. The additional matching window should append after the
  pinned prefix.
- Keep the normal visible model filtered to the current virtual desktop and the
  activity scope used by KDE's task manager, but do not filter it to the current
  screen.
- Number only rows 0 through 8 in the visible model; these correspond to
  user-facing slots 1 through 9.
- Keep demanding-attention tasks from other virtual desktops out of the normal
  numbered model so remote notifications cannot renumber slots 1 through 9.

## Remote Attention Policy

- Treat remote notifications as task-manager attention state, specifically
  `AbstractTasksModel::IsDemandingAttention`.
- The normal visible model should keep filtering to the current virtual desktop
  and the activity scope used by KDE's task manager. Do not let
  demanding-attention tasks bypass that model's virtual desktop filter.
- Use a separate remote-attention path to find demanding-attention window tasks
  that are hidden only because they are on another virtual desktop. Include
  tasks from any screen.
- Expose remote attention as one task-like item instead of inserting those
  windows into the normal task order.
- Render the remote-attention item at the far right of the widget, outside the
  normal numbered rows.
- `Meta+0` activates the final item in the composed visible item order. It is
  based on model order, not on pixel clipping or a numbered model row, and must
  not affect row numbering or pinned launcher positions.
- When the remote-attention item exists, it is the `Meta+0` target because it is
  appended as the final item in the composed visible item order. Do not give
  remote attention a separate shortcut priority.
- Do not render a `0` badge on the far-right item. Number badges are only for
  slots 1 through 9.
- When multiple remote attention tasks exist, keep a deterministic most-recent
  target for the remote-attention item and display the number of pending remote
  attention tasks.

## Visual Policy

- Render slot numbers as lower-left icon badges by default.
- Use KDE's fixed-width font for number labels.
- Badge rendering should require enough task icon space for at least a 10 px
  digit and enough badge padding for contrast. Fall back to prefix numbering
  below that threshold.
- Prefix fallback should keep the same slot number and activation behavior as
  badge mode.
- Do not render a `0` number badge for `Meta+0`.

## Packaging And Dependencies

- The package currently declares Plasma 6.5 as the minimum supported API version;
  keep that minimum unless an implementation detail requires raising it.
- Nix build, check, and development shells must include the QML import path for
  Plasma Workspace so `org.kde.taskmanager` resolves during linting and local
  development.
- If the implementation imports or adapts upstream Plasma task manager QML files,
  preserve their SPDX copyright and license headers.
- If upstream GPL-2.0-or-later QML code is included, document the source file and
  commit or Plasma branch in the adapted file header.

## Verification

- Run the package lint/check commands after implementation changes.
- Manually verify in Plasma that `Meta+1` through `Meta+9` target the numbered
  visible slots.
- Verify pinned launcher activation opens in place and does not append the first
  matching window to the far right.
- Verify opening an extra same-application window keeps the existing pinned-slot
  window in place, appends the new window after the pinned prefix, and does not
  group the windows.
- Verify pinned items can be reordered within the pinned prefix and unpinned
  items can be reordered within the unpinned suffix.
- Verify closing a pinned-slot window refills from another same-application
  window, or returns to the launcher when none remains.
- Verify the normal task list is not limited to the current screen.
- Verify tasks after slot 9 are visible and unnumbered.
- Verify `Meta+0` activates the final item in the visible item order when no
  remote attention item is shown, without rendering a `0` badge on that item.
- Verify that if the `Meta+0` target is also one of slots 1 through 9, both
  shortcuts activate the same item.
- Verify small icon or panel cases switch to prefix numbering instead of showing
  unreadable badges.
- Verify a window demanding attention on another virtual desktop appears through
  the far-right attention item without changing `Meta+1` through `Meta+9`
  targets, moving existing slots, or showing a `0` badge.
- Verify `Meta+0` switches to the remote task's virtual desktop and raises the
  demanding-attention window when the remote-attention item is the final item in
  the visible item order.
- Verify multiple remote attention tasks show a count and keep a deterministic
  remote-attention target.
