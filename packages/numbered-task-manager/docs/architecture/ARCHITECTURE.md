# Numbered Task Manager Architecture

This document records implementation constraints for the user behavior described
in `SPEC.md`.

## Implementation Strategy

- Build on KDE Plasma's task manager APIs instead of implementing window
  discovery or activation from scratch.
- Use the Plasma Workspace `org.kde.taskmanager` QML module for task data and
  task actions.
- Advertise Plasma's fill-area constraint and request fill layout on both axes so the widget occupies available panel space; task delegates remain content-sized while the task list viewport absorbs extra long-axis space and clips when content exceeds the panel allocation.
- Keep the implementation on public QML APIs where possible. Context menu
  actions should call `TasksModel.request*` methods directly.
- Implement drag reordering with a widget-owned task MIME type. Reorder pinned
  rows by rewriting the persisted launcher list so launch-in-place window rows
  cannot collide with `TasksModel.move()` launcher barriers. Keep manually
  reordered unpinned windows in widget state.
- Keep activity scope primitives in `ActivityScopeLogic.js` so null-activity,
  all-activities, de-duplication, and current-activity membership semantics are
  shared by task and launcher code.
- Keep task activity mutation decisions in `TaskActivityLogic.js` so task
  activity toggles are shared by the task model and context menu.
- Create task context menus per invocation as Plasma-native menus. Do not keep a
  long-lived Qt Quick Controls popup inside `fullRepresentation`, because panel
  delegates need a native menu anchored to the task delegate to avoid clipping
  and applet-menu collisions.
- Keep `PlasmaExtras.Menu` direct content limited to menu items. Helper objects,
  dynamic item factories, and submenus should be object-valued properties so
  they do not enter the menu's `QMenuItem` content list.
- Read task context-menu data from live `TasksModel` roles through the menu's
  model index when invoking task actions. Snapshot data may describe the
  visible delegate, but menu mutations should target the current model entry.
- Keep context-menu live role access and menu-facing role snapshots in
  `TaskContextMenuLogic.js`. `TaskContextMenu.qml` should render menu sections
  from helper output and must not call `taskModel.data(...)` directly.
- Keep context-menu launcher-activity menu state in `TaskContextMenuLogic.js`.
  Raw launcher activity lists entering the menu should be normalized through the
  same all-activities semantics as launcher serialization before checked-state
  predicates are evaluated. QML menu items should consume the helper output
  directly instead of adding menu-local checked-state wrapper functions.
- Keep context-menu task-activity checked-state policy in
  `TaskContextMenuLogic.js`. Task activity mutation decisions remain in
  `TaskActivityLogic.js`, but menu-facing all-activities and per-activity
  checked predicates should come from tested helper output. QML menu items
  should consume that output directly instead of adding menu-local
  checked-state wrapper functions.
- Keep context-menu virtual-desktop checked-state policy in
  `TaskContextMenuLogic.js`. The menu may still request `TasksModel`
  virtual-desktop mutations directly, but all-desktops and per-desktop checked
  predicates should be derived by a tested helper. QML menu items should
  consume that helper output directly instead of adding menu-local
  checked-state wrapper functions.
- Keep context-menu basic action availability in `TaskContextMenuLogic.js`.
  Simple item visible/enabled predicates such as New Instance, Move, and Resize
  should be derived by tested helpers while QML keeps rendering order and Plasma
  request dispatch.
- Keep checkable context-menu window action state in `TaskContextMenuLogic.js`.
  Checked, visible, and enabled predicates for actions such as Minimize,
  Maximize, Keep Above, Keep Below, Full Screen, Shade, No Border, and Exclude
  From Capture should be derived by tested helpers while QML keeps labels and
  effect dispatch.
- Keep context-menu section and terminal action availability in
  `TaskContextMenuLogic.js`. Section visibility and enabled/visible predicates
  for Virtual Desktops, Activities, New Desktop, and Close should be derived by
  tested helpers while QML keeps submenu composition and effect dispatch.
- Keep launcher-list transformations in `LauncherListLogic.js` so serialized
  activity prefixes, visible launcher positions, and pinned launcher reordering
  are exercised by unit tests instead of being spread across QML components.
- Keep widget pin membership in `LauncherListLogic.js`, derived from launcher URL, launcher list, current activity, and launcher-position lookup. Context-menu Pin/Unpin state should consume that menu-facing pin state instead of KDE's raw launcher-association role.
- Keep launcher-list mutation decisions in `LauncherListLogic.js`. QML code may
  apply returned writes to Plasma objects, but normalization, equality checks,
  and derived launcher activity lists should stay in tested helper functions.
- Keep cross-cutting task-entry mechanics in `TaskEntryLogic.js`. Role
  coercion, launcher URL precedence, title/icon fallback, model-index validity,
  and virtual-desktop membership should not be duplicated between normal task
  composition, remote attention, context menu code, and task-like delegates.
- Keep normal-task projection dependencies explicit. `TaskModelLogic.js` should include the shared task-entry mechanics it needs directly instead of accepting a broad runtime-injected `taskEntryLogic` namespace from QML call sites.
- Keep normal-task entry schema limited to fields with production consumers or documented purpose. Raw upstream launcher association should not be carried as a separate `hasAnyLauncher` field unless a production consumer is added.
- Keep normal task publication state transitions in `NormalTaskStoreLogic.js`.
  `NormalTaskSource.qml` owns observation of the normal `TasksModel` rows and
  emits explicit publication/removal events into the root-owned store.
  Publication-key allocation, publish/remove events, manual-order pruning,
  publication-counter state, and composed normal snapshots should be exercised
  by pure tests. Root QML should bind to one normal-task store state instead of
  owning hidden normal publication delegates or separate entry-map and
  manual-order properties.
- Keep launcher-list writes owned by the root widget. Child components such as
  the task context menu may compute and request a replacement launcher list, but
  `main.qml` is responsible for applying it to `TasksModel` and persisting it to
  plasmoid configuration.
- Apply launcher-list writes through a root-owned transaction that always releases its update guard. Keep post-write convergence checks and bounded next-change reconciliation state in `LauncherListLogic.js` so failed model/config writes can be logged and retried once with the attempted launcher list.
- Keep remote-attention qualification, keying, ordering, state transitions, and
  count/target snapshots in `RemoteAttentionLogic.js` so the separate attention
  model remains testable independently from normal task composition.
  `RemoteAttentionSource.qml` owns observation of the attention `TasksModel`
  rows and emits explicit publication/removal events into the root-owned state.
  Root QML should bind to one remote-attention state instead of owning hidden
  attention publication delegates or separate entry-map, order, count, entries,
  and target properties.
- Keep remote-attention projection dependencies explicit. `RemoteAttentionLogic.js` should include the shared task-entry mechanics it needs directly instead of accepting a broad runtime-injected `taskEntryLogic` namespace from QML call sites.
- Keep composed visible item order, slot labels, `Meta+0` target selection, item source metadata, and item count in a visible-item composer instead of reconstructing those policies independently in root activation, layout sizing, and delegates.
- Keep shortcut activation, context-menu creation, and launcher pin/unpin request outcomes in a small action-result helper. Root QML should still execute Plasma side effects, but invalid requests, stale model indexes, missing targets, rejected launcher requests, and creation failures should be classified before deciding whether to log a diagnostic.
- Keep context-menu task request outcomes in the same action-result helper.
  `TaskContextMenu.qml` may execute `TasksModel.request*` effects directly from
  typed command descriptors, but missing task models, stale model indexes, and
  missing request methods should be classified before the Plasma request is
  attempted. Request execution failures should also be converted to structured
  diagnostic results.
- Keep context-menu launcher effects on typed command descriptors. The menu may
  request pin, unpin, and replacement launcher-list effects, but root QML should
  remain responsible for executing those effects against `TasksModel` and
  plasmoid configuration. Root dispatch of malformed or unknown launcher
  commands should produce structured diagnostic results instead of silent
  no-ops.
- Do not claim support for upstream task-manager private backend behavior, such
  as file-open drops onto task delegates, unless that backend integration is
  actually added.

## Model Policy

- Use manual task ordering so user drag order can define shortcut positions
  within the pinned prefix and within the unpinned suffix.
- Treat the pinned/unpinned boundary as fixed for drag reordering. Drops across
  the boundary should be ignored and must not pin, unpin, or reorder the item.
- Disable application grouping so each window has a separate task item.
- Keep pinned launchers and their in-place windows as a contiguous prefix of the
  normal visible model.
- Keep activated launcher rows in the source `TasksModel`, then hide or replace
  them only while composing the widget-visible model. This prevents remote
  demanding-attention windows from consuming pinned launcher slots before the
  widget can separate them into the remote-attention path.
- Enable launch-in-place ordering so a matching current-desktop window is a
  candidate for its pinned launcher slot.
- Append unpinned windows and extra windows from pinned applications after the
  pinned prefix.
- Do not replace or move an existing pinned-slot window when an additional
  matching window appears. The additional matching window should append after the
  pinned prefix.
- Keep the normal visible model filtered to the current virtual desktop and the
  activity scope used by KDE's task manager, but do not filter it to the current
  screen.
- Treat an empty activity list and KDE's null activity UUID as the same
  all-activities state in launcher, normal task, and remote-attention filters.
- Rewrite a launcher's serialized activity prefix in place when changing
  launcher activity scope. Do not remove and re-add the launcher, because that
  can disturb pinned order or delete the launcher when the resulting activity
  set would otherwise be empty.
- Number only rows 0 through 8 in the visible model; these correspond to
  user-facing slots 1 through 9.
- Keep demanding-attention tasks from other virtual desktops out of the normal
  numbered model so remote attention cannot renumber slots 1 through 9.

## Remote Attention Policy

- Treat remote attention as task-manager attention state, specifically
  `AbstractTasksModel::IsDemandingAttention`.
- The normal visible model should keep filtering to the current virtual desktop
  and the activity scope used by KDE's task manager. Do not let
  demanding-attention tasks bypass that model's virtual desktop filter.
- Use a separate remote-attention path to find demanding-attention window tasks
  within KDE task manager's current activity scope that are hidden only because
  they are on another virtual desktop. Include tasks from any screen.
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
- When multiple remote attention tasks exist, target the window that most
  recently entered the demanding-attention state observed by this widget and
  display the number of pending remote attention tasks.
- KDE's task model does not expose historical attention-entry timestamps for
  windows already demanding attention before the widget observes them. Those
  startup entries therefore use task model publication order until a later
  observed `false -> true` attention transition moves a task to the target end.

## Visual Policy

- Render slot numbers as lower-left icon badges by default.
- Use KDE's fixed-width font for number labels.
- Task items should keep the icon in an explicit overlay container: the icon is the base layer, and the slot badge is a higher `z` layer anchored to the lower-left of the icon bounds.
- Badge components should own their rendered width and height, not only implicit size, so QML anchors have real geometry to position.
- Badge rendering should require enough task icon space for at least a 10 px digit and enough badge padding for contrast. Fall back to prefix numbering only below that threshold.
- Prefix fallback should keep the same slot number and activation behavior as
  badge mode.
- Do not render a `0` number badge for `Meta+0`.
- Render task delegate state backgrounds with `KSvg.FrameSvgItem` from Plasma's `widgets/tasks` theme asset instead of hand-painted QML rectangles.
- Keep the themed frame prefix decision in a small tested helper so normal, hover, active, minimized, attention, launcher, drag-drop target, and panel-edge fallbacks stay aligned with KDE task manager behavior.
- Keep task visual metrics in `TaskMetricsLogic.js`. Delegate size, icon extent, and theme-margin adjustment should have one tested owner instead of being duplicated by normal task and remote-attention delegates.
- Keep task item number presentation in `TaskItemPresentationLogic.js`. Slot label text and the `none`, `prefix`, or `overlay` decision should have one tested owner instead of being derived from visual-state side effects in delegates.
- Number presentation must use state-independent cross-axis availability so frame prefix, pinned, launcher, active, hover, and attention state cannot change the fallback threshold for the same slot and panel size.
- Keep hover-active icon decisions in `TaskVisualLogic.js`. A task model's active-window state selects the frame `focus` prefix only; icon active rendering is controlled by delegate highlight state.
- Treat a closed pinned launcher as a delegate-only muted launcher visual state. This must not change the model minimized state or the styling of real minimized windows.
- Render muted launcher idle backgrounds by reusing the themed minimized frame with reduced frame and content opacity; return to full opacity for hover, keyboard focus, open-menu, attention, or drag-drop feedback.
- Each task-like delegate owns its own `visualHighlighted` state from pointer hover, keyboard focus, and task-menu-open status. The root widget owns menu lifecycle, but it must not own per-delegate hover state.
- Anchor themed task frames to the full delegate bounds so the task background owns the panel cross-axis.
- Keep task-to-task layout spacing at zero; only theme margins and explicit content padding should create visible internal breathing room.
- Anchor task content inside the themed frame margins plus normal Kirigami spacing so Plasma themes can own the visible background geometry without covering badges, icons, or titles.
- Start-align closed pinned launcher content within the adaptive task slot; keep centered title-hidden layout for other task-like delegates.

## Packaging And Dependencies

- The package currently declares Plasma 6.6 as the minimum supported API version;
  keep that minimum unless an implementation detail requires raising it.
- Visual task metrics should match KDE Plasma 6.6's default icons-and-text task manager through local helper logic with explicit inputs, not through imports of Plasma private task-manager QML modules.
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
- Verify cross-boundary drag drops are ignored and do not pin, unpin, or reorder
  the item.
- Verify closing a pinned-slot window follows Plasma TasksModel
  launcher/window matching for refill selection, keeps remaining unpinned
  windows in relative order, or returns to the launcher when none remains.
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
- Verify remote attention is not limited to the current screen and follows KDE
  task manager's activity scope.
- Verify `Meta+0` switches to the remote task's virtual desktop and raises the
  demanding-attention window when the remote-attention item is the final item in
  the visible item order.
- Verify multiple remote attention tasks show a count and target the window that
  most recently entered the demanding-attention state after the widget observes
  the transition.
