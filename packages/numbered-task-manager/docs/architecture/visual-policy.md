# Numbered Task Manager Visual Policy

## Number Presentation

- Render slot numbers as lower-left icon badges by default.
- Use KDE's fixed-width font for number labels.
- Task items should keep the icon in an explicit overlay container: the icon is the base layer, and the slot badge is a higher `z` layer anchored to the lower-left of the icon bounds.
- Badge components should own their rendered width and height, not only implicit size, so QML anchors have real geometry to position.
- Badge rendering should require enough task icon space for at least a 10 px digit and enough badge padding for contrast. Fall back to prefix numbering only below that threshold.
- Prefix fallback should keep the same slot number and activation behavior as badge mode.
- Do not render a `0` number badge for `Meta+0`.
- Keep task item number presentation in `TaskItemPresentationLogic.mjs`. Slot label text and the `none`, `prefix`, or `overlay` decision should have one tested owner instead of being derived from visual-state side effects in delegates.
- Number presentation must use state-independent cross-axis availability so frame prefix, pinned, launcher, active, hover, and attention state cannot change the fallback threshold for the same slot and panel size.

## Themed Frames And Shared Components

- Render task delegate state backgrounds with `KSvg.FrameSvgItem` from Plasma's `widgets/tasks` theme asset instead of hand-painted QML rectangles.
- Keep the themed frame prefix decision in a small tested helper so normal, hover, active, minimized, attention, launcher, drag-drop target, and panel-edge fallbacks stay aligned with KDE task manager behavior.
- Keep shared task-like frame binding in `TaskLikeFrame.qml`. Normal and remote-attention delegates should provide their variant frame state inputs while `TaskFrame` anchoring, property forwarding, and exposed content margins live in one component.
- Keep the shared task-like item shell in `TaskLikeItemShell.qml`. Normal and remote-attention delegates should provide variant frame state, content, activation handling, and optional drag/drop, while frame/content/interaction composition, implicit task extent, natural implicit width, title visibility, icon extent, and visual-highlight state live in one component.
- Keep hover-active icon decisions in `TaskVisualLogic.mjs`. A task model's active-window state selects the frame `focus` prefix only; icon active rendering is controlled by delegate highlight state.
- Keep shared task-like icon rendering in `TaskLikeIcon.qml`. Normal and remote-attention delegates should provide their variant fallback/source and active/highlighted inputs, while icon active-state mapping and `KirigamiPrimitives.Icon` setup live in one component.
- Keep shared task-like icon slot layout in `TaskLikeIconSlot.qml`. Normal and remote-attention delegates should provide icon inputs and variant badge content, while layout alignment, icon extent sizing, and icon anchoring live in one component.
- Keep shared task-like title text rendering in `TaskLikeTitle.qml`. Normal and remote-attention delegates should provide title text, visibility, and minimized strikeout inputs while eliding, fill-width layout, color, and single-line text setup live in one component.
- Keep shared task-like content row geometry in `TaskLikeContentRow.qml`. Normal and remote-attention delegates should keep their variant child content, while themed-frame content margins, internal Kirigami spacing, content horizontal padding, and content opacity application live in one row component.
- Keep shared task-like title-hidden fill spacer geometry in `TaskLikeContentSpacer.qml`. Normal and remote-attention delegates should provide only the variant fill condition while spacer visibility and `Layout.fillWidth` stay in one component.

## Layout Metrics And State

- Keep task visual metrics in `TaskMetricsLogic.mjs`. Delegate size, task-like implicit width selection, title visibility threshold, task-like title visibility, slot width cap, natural-width minima, natural-width clamping, icon extent, and theme-margin adjustment should have one tested owner instead of being duplicated by root layout, normal task, and remote-attention delegates.
- Treat a closed pinned launcher as a delegate-only muted launcher visual state. This must not change the model minimized state or the styling of real minimized windows.
- Render muted launcher idle backgrounds by reusing the themed minimized frame with reduced frame and content opacity; return to full opacity for hover, keyboard focus, open-menu, attention, or drag-drop feedback.
- Each task-like delegate owns its own `visualHighlighted` state from pointer hover, keyboard focus, and task-menu-open status. The root widget owns menu lifecycle, but it must not own per-delegate hover state.
- Anchor themed task frames to the full delegate bounds so the task background owns the panel cross-axis.
- Keep task-to-task layout spacing at zero; only theme margins and explicit content padding should create visible internal breathing room.
- Anchor task content inside the themed frame margins plus normal Kirigami spacing so Plasma themes can own the visible background geometry without covering badges, icons, or titles.
- Start-align closed pinned launcher content within the adaptive task slot; keep centered title-hidden layout for other task-like delegates.
