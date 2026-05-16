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

- Use manual task ordering so user drag order can define shortcut positions.
- Disable application grouping so each window has a separate task item.
- Keep launchers and windows in one mixed task list, allowing pinned launchers to
  be interleaved with windows.
- Enable launch-in-place behavior so a matching window occupies its pinned
  launcher slot.
- Append unpinned windows and extra windows from pinned applications after the
  pinned slots.
- Number only rows 0 through 8 in the visible model; these correspond to
  user-facing slots 1 through 9.

## Visual Policy

- Render slot numbers as lower-left icon badges by default.
- Use KDE's fixed-width font for number labels.
- Badge rendering should require enough task icon space for at least a 10 px
  digit and enough badge padding for contrast. Fall back to prefix numbering
  below that threshold.
- Prefix fallback should keep the same slot number and activation behavior as
  badge mode.

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
- Verify extra same-application windows append after the pinned area and are not
  grouped.
- Verify closing a pinned-slot window refills from another same-application
  window, or returns to the launcher when none remains.
- Verify tasks after slot 9 are visible and unnumbered.
- Verify small icon or panel cases switch to prefix numbering instead of showing
  unreadable badges.
