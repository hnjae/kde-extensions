# Numbered Task Manager Packaging And Verification

## Packaging And Dependencies

- The package currently declares Plasma 6.6 as the minimum supported API version; keep that minimum unless an implementation detail requires raising it.
- Visual task metrics should match KDE Plasma 6.6's default icons-and-text task manager through local helper logic with explicit inputs, not through imports of Plasma private task-manager QML modules.
- Nix build, check, and development shells must include the QML import path for Plasma Workspace so `org.kde.taskmanager` resolves during linting and local development.
- If the implementation imports or adapts upstream Plasma task manager QML files, preserve their SPDX copyright and license headers.
- If upstream GPL-2.0-or-later QML code is included, document the source file and commit or Plasma branch in the adapted file header.

## Verification

- Run the package lint/check commands after implementation changes.
- Manually verify in Plasma that `Meta+1` through `Meta+9` target the numbered visible slots.
- Verify pinned launcher activation opens in place and does not append the first matching window to the far right.
- Verify opening an extra same-application window keeps the existing pinned-slot window in place, appends the new window after the pinned prefix, and does not group the windows.
- Verify pinned items can be reordered within the pinned prefix and unpinned items can be reordered within the unpinned suffix.
- Verify cross-boundary drag drops are ignored and do not pin, unpin, or reorder the item.
- Verify closing a pinned-slot window follows Plasma TasksModel launcher/window matching for refill selection, keeps remaining unpinned windows in relative order, or returns to the launcher when none remains.
- Verify the normal task list is not limited to the current screen.
- Verify tasks after slot 9 are visible and unnumbered.
- Verify `Meta+0` activates the final item in the visible item order when no remote attention item is shown, without rendering a `0` badge on that item.
- Verify that if the `Meta+0` target is also one of slots 1 through 9, both shortcuts activate the same item.
- Verify small icon or panel cases switch to prefix numbering instead of showing unreadable badges.
- Verify a window demanding attention on another virtual desktop appears through the far-right attention item without changing `Meta+1` through `Meta+9` targets, moving existing slots, or showing a `0` badge.
- Verify remote attention is not limited to the current screen and follows KDE task manager's activity scope.
- Verify `Meta+0` switches to the remote task's virtual desktop and raises the demanding-attention window when the remote-attention item is the final item in the visible item order.
- Verify multiple remote attention tasks show a count and target the window that most recently entered the demanding-attention state after the widget observes the transition.
