# Numbered Task Manager Platform And Model Scope

## Shared Scope Policy

- Keep activity scope primitives in `ActivityScopeLogic.mjs` so null-activity, all-activities, de-duplication, and current-activity membership semantics are shared by task and launcher code.
- Keep task-model scope policy in `TaskScopeLogic.mjs`. Normal and remote attention `TasksModel` filter settings and local qualification helpers should be named together so QML does not carry unexplained raw filter booleans or split scope decisions across unrelated modules.
- Keep virtual-desktop identity and membership primitives in `VirtualDesktopLogic.mjs`. Desktop ID coercion, desktop-list membership, current-desktop qualification, remote-desktop qualification, and context-menu virtual-desktop checked-state primitives should be shared by task scope and menu policy instead of being reimplemented in task-entry or context-menu modules.
- Do not re-export scope qualification helpers from task-specific modules once source components consume `TaskScopeLogic.mjs` directly. `TaskModelLogic.mjs` should own normal task entry/composition policy, and `RemoteAttentionLogic.mjs` should own remote-attention entry/state policy.
- Keep task activity mutation decisions in `TaskActivityLogic.mjs` so task activity toggles are shared by the task model and context menu. Generic current-activity and all-activities primitives should be imported from `ActivityScopeLogic.mjs` directly.

## Model Policy

- Use manual task ordering so user drag order can define shortcut positions within the pinned prefix and within the unpinned suffix.
- Treat the pinned/unpinned boundary as fixed for drag reordering. Drops across the boundary should be ignored and must not pin, unpin, or reorder the item.
- Disable application grouping so each window has a separate task item.
- Keep pinned launchers and their in-place windows as a contiguous prefix of the normal visible model.
- Keep activated launcher rows in the source `TasksModel`, then hide or replace them only while composing the widget-visible model. This prevents remote demanding-attention windows from consuming pinned launcher slots before the widget can separate them into the remote-attention path.
- Enable launch-in-place ordering so a matching current-desktop window is a candidate for its pinned launcher slot.
- Append unpinned windows and extra windows from pinned applications after the pinned prefix.
- Do not replace or move an existing pinned-slot window when an additional matching window appears. The additional matching window should append after the pinned prefix.
- Keep the normal visible model filtered to the current virtual desktop and the activity scope used by KDE's task manager, but do not filter it to the current screen.
- Treat an empty activity list and KDE's null activity UUID as the same all-activities state in launcher, normal task, and remote-attention filters.
- Rewrite a launcher's serialized activity prefix in place when changing launcher activity scope. Do not remove and re-add the launcher, because that can disturb pinned order or delete the launcher when the resulting activity set would otherwise be empty.
- Number only rows 0 through 8 in the visible model; these correspond to user-facing slots 1 through 9.
- Keep demanding-attention tasks from other virtual desktops out of the normal numbered model so remote attention cannot renumber slots 1 through 9.

## Remote Attention Policy

- Treat remote attention as task-manager attention state, specifically `AbstractTasksModel::IsDemandingAttention`.
- The normal visible model should keep filtering to the current virtual desktop and the activity scope used by KDE's task manager. Do not let demanding-attention tasks bypass that model's virtual desktop filter.
- Use a separate remote-attention path to find demanding-attention window tasks within KDE task manager's current activity scope that are hidden only because they are on another virtual desktop. Include tasks from any screen.
- Expose remote attention as one task-like item instead of inserting those windows into the normal task order.
- Render the remote-attention item at the far right of the widget, outside the normal numbered rows.
- `Meta+0` activates the final item in the composed visible item order. It is based on model order, not on pixel clipping or a numbered model row, and must not affect row numbering or pinned launcher positions.
- When the remote-attention item exists, it is the `Meta+0` target because it is appended as the final item in the composed visible item order. Do not give remote attention a separate shortcut priority.
- Do not render a `0` badge on the far-right item. Number badges are only for slots 1 through 9.
- When multiple remote attention tasks exist, target the window that most recently entered the demanding-attention state observed by this widget and display the number of pending remote attention tasks.
- KDE's task model does not expose historical attention-entry timestamps for windows already demanding attention before the widget observes them. Those startup entries therefore use task model publication order until a later observed `false -> true` attention transition moves a task to the target end.
