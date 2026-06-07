# Design Review: Correct End State

## Executive Summary

Numbered Task Manager already has a useful architecture direction: Plasma APIs are isolated behind QML, many domain decisions live in small JavaScript helpers, and the docs clearly describe the intended behavior. The main design risk is that the implementation has not fully caught up with that direction. Core policy is still split across `main.qml`, `TaskContextMenu.qml`, visual delegates, and helper modules, so the same concepts can be represented in multiple incompatible ways.

The highest-impact risks are pin state ownership, root-level model orchestration, context-menu policy placement, launcher synchronization reliability, and the composed visible-order contract behind numbering and `Meta+0`. These are not reasons for a rewrite. The correct end state is a small set of explicit owners: task-entry projection, launcher/pin state, model publication, remote attention, visible item composition, task actions, side-effect execution, diagnostics, metrics, and task-like delegate chrome.

No P0 issue was found. The review does identify several P1 risks where current design can cause wrong user-visible behavior, fragile persistence, or high change impact.

## Top Design Risks

1. **Pin state has competing definitions.** Normal task composition derives widget pin membership from `visibleLauncherPosition(...)`, but the context menu uses the live `HasLauncher` role for Pin/Unpin decisions, so the menu can act on a different concept than the visible model.
2. **`main.qml` is the implicit task-manager controller.** It owns platform models, hidden model-publishing delegates, ordering maps, remote-attention state, activation, launcher persistence, drag/drop, context-menu creation, and layout.
3. **`TaskContextMenu.qml` mixes rendering, role reads, action policy, and effects.** Action availability and launcher/activity mutation rules are embedded in a Plasma menu component instead of a tested action model.
4. **Launcher writes and user actions fail without recoverable semantics.** Launcher sync uses a mutable guard without `try/finally` or convergence checks, and activation/menu/pin/window actions often return silently on failure.
5. **Visible order, numbering, and shortcut targeting are separate projections.** Rendering appends remote attention structurally, numbering uses delegate index, and activation special-cases `index === 9`; the composed visible item order has no single owner.

## Single Source of Truth Violations

### Finding: Pin state has competing definitions

**Evidence:** `main.qml:361-363` derives `launcherPinned` from `visibleLauncherPosition(...)`; `main.qml:397-399` passes `launcherPinned`, `launcherPosition`, and `launcherUrl` into `TaskModelLogic.createNormalTaskEntry(...)`; `TaskModelLogic.js:10-23` distinguishes raw `hasLauncher` from widget pin membership by setting `hasAnyLauncher` from the raw role but `hasLauncher` from `isLauncher || launcherPinned`; `TaskContextMenu.qml:90-92` defines `hasLauncher()` from the live `atm.HasLauncher` role; `TaskContextMenu.qml:215-225` uses that result for Pin/Unpin; `TaskContextMenu.qml:232-234` uses it for launcher-activity visibility.

**Current state:** The visible model treats pinned state as membership in this widget's visible launcher list for the current activity. The context menu treats pinned state as the upstream task model's `HasLauncher` role, with fallback to the snapshot task field.

**Design concern:** Pin membership is a core widget invariant. Because it has two definitions, a launcher-capable but unpinned task can be presented as pinned, or a widget-pinned entry can be treated according to an upstream role that is not the widget's pin membership. This is a P1 correctness and maintainability risk.

**Correct end state:** `LauncherListLogic` or the normalized task-entry model should be the sole owner of widget pin membership. Menu state should consume explicit fields such as `isPinned`, `canPin`, `launcherUrl`, and `pinnedLauncherPosition`. Live task roles may still be used for window action availability, but not to redefine widget pin state.

**Suggested migration:** Add a pure helper that derives menu-facing pin state from launcher URL, launcher list, activity scope, and normalized task snapshot. Use that helper in normal task entry creation and context menu action state. Rename menu-local `hasLauncher()` to separate launcher availability from `isPinned`. Add tests for launcher-capable unpinned windows and pinned launcher/window entries.

**Acceptance criteria:** Pin/Unpin text and launcher-activity visibility no longer read `atm.HasLauncher` directly; task composition and context-menu pin state use the same helper/state; tests cover pinned, unpinned, launcher-capable, and launcher-only cases.

**Priority:** P1

### Finding: Visible order, slot numbering, and shortcut targeting are separate projections

**Evidence:** The spec defines numbered slots and `Meta+0` behavior in `docs/spec/SPEC.md:32-33` and `docs/spec/SPEC.md:85-94`; `main.qml:44-65` resolves shortcut activation and special-cases `index === 9`; `main.qml:489-490` computes visible count separately from activation; `main.qml:512-596` renders `root.normalTaskEntries` followed by a separate `AttentionItem`; `main.qml:538` assigns badges with `index < 9 ? index + 1 : 0`; `TaskItemPresentationLogic.js:6-8` separately validates badgeable numbers as `1..9`; tests assert some of these literals in `tests/taskitempresentationlogic.test.mjs:70-78` and `tests/taskvisuallogic.test.mjs:167`.

**Current state:** The final visible order is reconstructed in several places: root activation code, layout structure, delegate slot-number binding, presentation validation, and visible-count sizing.

**Design concern:** The widget's defining invariant is that shortcuts target the composed visible order. Because no single object owns that order, a future change to remote attention, additional item types, or slot numbering can leave activation, visible labels, sizing, and rendering out of sync.

**Correct end state:** A tested visible-item composer should return descriptors for every rendered item, including item type, source model, model index, slot number, whether it is the `Meta+0` target, and whether it participates in normal numbering. `main.qml` should render and activate from that composed list instead of recomputing pieces of the policy.

**Suggested migration:** Introduce `composeVisibleTaskItems(normalEntries, remoteAttentionSnapshot)` or equivalent. First use it for visible count and activation target lookup. Then migrate delegate inputs to consume the same slot metadata. Keep `TaskItemPresentationLogic` focused on choosing `none`, `prefix`, or `overlay` from an already-authoritative slot number.

**Acceptance criteria:** `Meta+0` resolution is tested against the same composed item list used for rendering metadata; no call site outside the composer special-cases `index === 9`; tests cover no tasks, fewer than nine tasks, more than nine tasks, and remote attention present.

**Priority:** P1

### Finding: Task role normalization, fallback policy, and task-entry schema have multiple owners

**Evidence:** `TaskEntryLogic.js:55-101` owns model-index validity, coercion, title fallback, icon fallback, and base task entry creation; `main.qml:361` and `main.qml:441` duplicate `LauncherUrlWithoutIcon || LauncherUrl`; `TaskContextMenu.qml:57-92` implements live role access and coercion helpers; `TaskItem.qml:29` and `AttentionItem.qml:22` define local icon fallbacks; `TaskModelLogic.js:4-52` and `RemoteAttentionLogic.js:4-13` accept a broad `taskEntryLogic` object at runtime; `TaskModelLogic.js:22` creates `hasAnyLauncher`, and `rg` finds no production consumer outside its test.

**Current state:** Base task projection mostly lives in `TaskEntryLogic.js`, but launcher URL precedence, fallback icon constants, live role reads, and entry schema dependencies are spread across QML and helper modules.

**Design concern:** Visible task state, context-menu state, and rendered fallback state can diverge. The injected `taskEntryLogic` namespace also makes factory dependencies implicit and runtime-checked only.

**Correct end state:** `TaskEntryLogic.js` or a named role adapter should own task role projection, launcher URL precedence, fallback constants, model-index validity, and diagnostics for malformed required roles. `TaskModelLogic` should own normal-task fields and ordering. `RemoteAttentionLogic` should own remote-only qualification and ordering. Dependencies should be explicit imports or narrow function parameters, not a broad helper namespace.

**Suggested migration:** Centralize launcher URL extraction and fallback icon constants first. Add a live-role reader helper that accepts `taskModel`, `modelIndex`, role IDs, and snapshot fallbacks. Remove the injected `taskEntryLogic` parameter from one factory at a time. Delete unused schema fields such as `hasAnyLauncher` or document their intended consumer before expanding the schema.

**Acceptance criteria:** No duplicate `LauncherUrlWithoutIcon || LauncherUrl` expression remains outside the shared helper; fallback icon strings are defined in one module; `TaskModelLogic` and `RemoteAttentionLogic` no longer accept a generic `taskEntryLogic` object; every entry field has a production consumer or documented purpose.

**Priority:** P2

### Finding: Task metrics constants are split across root and delegates

**Evidence:** `TaskMetricsLogic.js:31-79` owns sizing formulas; `main.qml:486-493` defines task extent `40`, title threshold `96`, visible count, minimum width, and max slot width `220`; `TaskItem.qml:28`, `TaskItem.qml:44-55`, `AttentionItem.qml:21`, and `AttentionItem.qml:27-36` repeat title threshold, implicit height, max width, and natural-width minima; `NumberBadge.qml:14-15` and `NumberBadge.qml:34` own badge dimensions and font size; tests assert some literal QML expressions in `tests/taskmetricslogic.test.mjs:30-66` and `tests/taskitempresentationlogic.test.mjs:96-100`.

**Current state:** Formulas are centralized, but the constants driving those formulas are local literals in root layout and delegates.

**Design concern:** Changing panel sizing, title visibility, or badge sizing requires coordinated edits across several files and tests. This violates the architecture note that visual task metrics should have one tested owner.

**Correct end state:** A single metrics owner should expose named values and formulas for task extent, title threshold, slot width cap, minimum readable slot width, normal and attention natural-width minima, and badge metrics. Intentional differences should be named.

**Suggested migration:** Extend `TaskMetricsLogic.js` or add a small QML metrics singleton. Replace QML literals with named metric bindings. Convert regex assertions about metrics literals into behavior tests against the metrics owner.

**Acceptance criteria:** `main.qml`, `TaskItem.qml`, and `AttentionItem.qml` do not define independent copies of `40`, `96`, and `220`; tests fail if normal task and attention task title thresholds drift unintentionally; badge constants are either centralized or explicitly documented as badge-local rendering policy.

**Priority:** P2

### Finding: Activity and scope policy has duplicated public surfaces

**Evidence:** `ActivityScopeLogic.js:4-78` owns null-activity, all-activities, normalization, containment, and current-activity membership; `TaskActivityLogic.js:4-28` includes and re-exports generic activity helpers; `LauncherListLogic.js:4-70` includes and re-exports or wraps generic helpers; `main.qml:192-193` calls `TaskActivityLogic.isInCurrentActivity`; `TaskContextMenu.qml:118-143` calls generic activity helpers through `TaskActivityLogic`; model filter policy lives in `main.qml:321-324` and `main.qml:345-348`, while local qualifiers live in `TaskModelLogic.js:55-78` and `RemoteAttentionLogic.js:16-33`.

**Current state:** Generic activity semantics are reachable through several modules, and task visibility depends on both QML `TasksModel` filter booleans and local qualifier functions.

**Design concern:** A future change to activity semantics, current-screen behavior, or desktop scope can be applied in one surface while another continues using old assumptions. The duplication may be intentional defense against upstream model behavior, but the policy is not named as one contract.

**Correct end state:** `ActivityScopeLogic.js` should be the only public owner of generic activity semantics. A scope policy owner should define normal-task and remote-attention model filter settings together with the matching local qualifier rules.

**Suggested migration:** Import `ActivityScopeLogic.js` directly where generic checks are needed. Remove pass-through exports from task and launcher modules after consumers migrate. Add a `TaskScopeLogic.js` or equivalent constants/helpers for normal and remote model filter settings and qualifiers.

**Acceptance criteria:** Generic activity functions are exported only from `ActivityScopeLogic.js`; `main.qml` does not hard-code activity/desktop filter booleans without referencing scope policy; tests cover model filter policy and local qualifiers together.

**Priority:** P2

## Invariant and Correctness Risks

### Finding: Launcher activity menu can represent an invalid all-activities state

**Evidence:** The spec says empty activity lists and KDE's null activity UUID both mean all activities in `docs/spec/SPEC.md:39-40`; `ActivityScopeLogic.js:37-52` implements `activitiesAreAll(...)` and `normalizedActivityList(...)`; `TaskContextMenu.qml:108-116` assigns `launcherActivityList` directly from `launcherModel.launcherActivities(url)`; `TaskContextMenu.qml:138-143` treats all activities as checked only when the null UUID is present; `LauncherListLogic.js:103-106` and `LauncherListLogic.js:196-198` normalize launcher activities elsewhere.

**Current state:** The menu can hold `launcherActivityList = []`. Shared domain logic says that means all activities, but the menu's all-activities predicate checks only for the null UUID.

**Design concern:** This makes an invalid menu state representable: "All Activities" can appear unchecked even though the underlying launcher state means all activities. It is a correctness risk and a symptom that menu policy bypasses the shared activity owner.

**Correct end state:** Launcher activity scope should enter menu logic as a normalized domain value. Menu predicates should call `activitiesAreAll(...)`, not check only for the null UUID.

**Suggested migration:** Normalize `launcherActivityList` in `refreshLauncherActivities()`. Extract launcher activity menu predicates into tested JavaScript helpers as part of the context-menu logic migration.

**Acceptance criteria:** A raw `[]` launcher activity list renders "All Activities" checked; individual activity checks treat both `[]` and the null UUID consistently; tests cover both inputs through menu-facing logic.

**Priority:** P2

### Finding: Launcher sync is not failure-safe

**Evidence:** `main.qml:76-84` sets `updatingLauncherConfig = true`, writes `Plasmoid.configuration.launchers`, then resets the flag without `try/finally`; `main.qml:87-101` does the same while writing `tasksModel.launcherList` and/or `Plasmoid.configuration.launchers`; `main.qml:334-338` suppresses persistence while `updatingLauncherConfig` is true; `LauncherListLogic.js:36-58` can tell whether model and config writes are expected to change.

**Current state:** Launcher model/config writes are one-shot assignments guarded by a mutable flag. There is no guaranteed flag reset, post-write convergence check, retry, or diagnostic.

**Design concern:** This boundary coordinates external Plasma model state with persisted plasmoid configuration. A failed or partial assignment can leave model/config diverged, and a stuck guard can suppress future persistence.

**Correct end state:** Launcher sync should be a root-owned transaction helper. It should reset guards in `finally`, record the intended launcher list, compare model/config convergence after writes, and emit diagnostics or bounded reconciliation for recoverable divergence.

**Suggested migration:** Add `withLauncherListUpdate(fn)` around the guard first. Then add post-write comparison using `LauncherListLogic.launcherListsEqual(...)`. Finally add a bounded retry or next-change reconciliation path for mismatch.

**Acceptance criteria:** `updatingLauncherConfig` is reset even if a launcher assignment fails; model/config mismatch after `applyLauncherList()` is detectable and logged; later `onLauncherListChanged` events cannot be permanently suppressed by a failed write.

**Priority:** P1

### Finding: Role coercion hides data-contract failures

**Evidence:** `TaskEntryLogic.js:55-58` treats an object with no `valid` property as a valid model index; `TaskEntryLogic.js:65-75` collapses missing or malformed strings/numbers to `""` and fallback values; `TaskEntryLogic.js:86-101` normalizes roles into fallback icon/title/index/activity/desktop values; `LauncherListLogic.js:10-17` filters empty/null launcher entries; tests assert some fallback behavior in `tests/taskentrylogic.test.mjs` and `tests/launcherlistlogic.test.mjs`.

**Current state:** Missing, malformed, intentionally absent, and upstream-contract-breaking data all become ordinary sentinel values.

**Design concern:** The applet depends on external Plasma roles. If those roles change shape or arrive malformed, tasks may be hidden, misordered, treated as unpinned, or activated through questionable indexes without an audit trail.

**Correct end state:** Normalization should preserve current fallback behavior where needed, but also return diagnostics for invalid required roles and fallback usage. Expected optional missing roles should stay quiet.

**Suggested migration:** Add optional diagnostic collection to `createBaseTaskEntry()` and `createNormalTaskEntry()` for high-impact fields: model index, source index, launcher URL, window/launcher booleans, activities, and virtual desktops. Aggregate or rate-limit diagnostics in the model publication layer.

**Acceptance criteria:** Malformed numeric index and unknown model-index shape produce tested diagnostics; expected optional missing fields do not warn; runtime diagnostics include source row/publication key and affected role.

**Priority:** P2

### Finding: Mutation helpers collapse different failures into the same result

**Evidence:** `TaskModelLogic.js:265-289` returns only `false` from `canMoveTask(...)` for negative indexes, same index, missing entries, pinned/unpinned boundary crossings, and pinned-launcher denial; `TaskModelLogic.js:240-254` returns `{ moved: false, order }` for missing source, missing target, and same-position moves; `LauncherListLogic.js:186-194` returns `null` for invalid launcher activity positions; `LauncherListLogic.js:295-339` returns `{ moved: false, launchers }` for invalid source/target positions, same position, out-of-range positions, and splice failure.

**Current state:** Callers see `false`, `null`, `-1`, or `{ moved: false }` without knowing whether the cause is expected policy denial, stale model state, invalid input, or an internal invariant failure.

**Design concern:** The helpers are the right ownership boundary, but their result shape discards useful information. That limits precise tests, targeted diagnostics, and future UI behavior for rejected drag/drop or launcher mutations.

**Correct end state:** Mutation helpers should return typed result objects with stable reason codes, while preserving existing boolean fields temporarily for migration.

**Suggested migration:** Add `reason` fields or parallel result helpers for move and launcher activity decisions. Update tests to assert reason codes for current false/null cases, then update QML callers to log unexpected/stale reasons and quietly ignore expected policy no-ops.

**Acceptance criteria:** Each current false/null movement outcome has a distinct tested reason; drag/drop rejection can distinguish boundary crossing from stale indexes; launcher activity updates distinguish invalid position from unchanged activity list.

**Priority:** P2

## Cohesion, Coupling, and Ownership Problems

### Finding: `main.qml` is the task-manager god object

**Evidence:** `main.qml:22-34` stores normal task maps/order, remote-attention maps/order, launcher revision, and launcher write state on `root`; `main.qml:44-298` owns activation, launcher persistence, pin/unpin, drag reordering, publication, remote attention, and context menu lifecycle; `main.qml:318-352` owns both `TaskManager.TasksModel` instances; `main.qml:354-480` uses hidden `Repeater` delegates to publish model rows; `main.qml:483-596` owns layout and rendered delegates.

**Current state:** The root applet is platform model owner, task store, launcher store, remote attention controller, drag controller, shortcut controller, context-menu factory, and visual layout.

**Design concern:** Unrelated responsibilities change the same stateful QML object. This makes ordering, stale removals, shortcut target changes, launcher persistence, and remote attention harder to reason about or test outside a live QML/Plasma runtime.

**Correct end state:** `main.qml` should be composition glue. It should instantiate platform adapters/controllers, bind UI to controller state, and execute explicit side-effect commands. Normal task publication/order, remote attention, launcher synchronization, and visible item composition should each have focused owners.

**Suggested migration:** Extract normal task publication/order into a controller or store first, keeping existing hidden repeaters as event producers. Then extract remote attention source and launcher sync. After state is owned by controllers, simplify root activation and layout bindings to consume composed visible items.

**Acceptance criteria:** `main.qml` no longer declares `normalTaskEntryMap`, `normalTaskManualOrder`, `remoteAttentionEntryMap`, or `remoteAttentionOrder`; publication/remove/reorder behavior is covered by unit tests outside `main.qml`; root still applies unavoidable Plasma writes but does not own unrelated ordering state.

**Priority:** P1

### Finding: `TaskContextMenu.qml` mixes UI, role access, action dispatch, and launcher mutation

**Evidence:** `TaskContextMenu.qml:57-92` reads live roles and projects fallbacks; `TaskContextMenu.qml:94-190` refreshes activities, launcher activities, and launcher-list mutations; `TaskContextMenu.qml:203-213` creates its own `ActivityInfo` and `VirtualDesktopInfo`; `TaskContextMenu.qml:215-536` renders menu items and directly calls many `taskModel.request*` methods; `TaskContextMenuLogic.js:4-18` only covers panel placement; `tests/taskcontextmenulogic.test.mjs:9-12` tests only placement plus source structure.

**Current state:** A 500+ line menu component owns rendering, live role reading, task action eligibility, platform action execution, activity/desktop discovery, launcher activity mutations, and menu lifecycle.

**Design concern:** The menu is both view and controller. Adding or changing one action requires understanding the whole menu, and action policy is hard to test without Plasma menu objects and `TasksModel` mocks.

**Correct end state:** `TaskContextMenu.qml` should own native menu lifecycle and section composition. A tested menu/action model should own role snapshot normalization, visible/enabled/checked state, labels, and action descriptors. Thin effect adapters should call `TasksModel` or emit launcher-list changes.

**Suggested migration:** Extract role snapshot normalization first. Then move launcher activity handling, virtual desktop state, task activity state, and window action state one section at a time into `TaskContextMenuLogic.js` or focused action modules. Keep user-visible menu order stable while replacing inline predicates with helper output.

**Acceptance criteria:** `TaskContextMenu.qml` no longer calls `taskModel.data()` directly; activity and desktop entries are injected or supplied by an adapter; action visibility/enabled state is covered by unit tests; click handlers dispatch typed commands or narrow signals rather than computing next state inline.

**Priority:** P1

### Finding: Task-like delegate chrome is duplicated

**Evidence:** `TaskItem.qml:25-48` and `AttentionItem.qml:17-30` duplicate task-like properties and highlight state; `TaskItem.qml:61-152` and `AttentionItem.qml:42-108` duplicate frame/content/icon/title layout; `TaskItem.qml:215-253` and `AttentionItem.qml:110-148` duplicate keyboard menu, hover, right-click, left-click, and delayed context-menu request behavior.

**Current state:** Normal tasks and the remote-attention item are separate components with copied task-like layout and interaction skeletons. Their main differences are normal numbering/drag-drop versus attention count badge and attention visual defaults.

**Design concern:** Changes to menu focus behavior, hover highlighting, title visibility, icon layout, frame margins, or content opacity must be applied in two files. Drift is likely.

**Correct end state:** A shared task-like delegate chrome component should own frame, layout, highlight, icon/title rendering, activation signal wiring, and context-menu request mechanics. `TaskItem` should own slot numbering and drag/drop. `AttentionItem` should own attention count and attention-specific state.

**Suggested migration:** Extract shared interaction first: hover, active focus, menu key/right-click timer, activation signal, and context-menu request. Then extract common frame/content row after the signal surface stabilizes.

**Acceptance criteria:** One component owns `visualHighlighted`, `contextMenuTimer`, keyboard menu handling, and right-click handling; task frame margins, icon active state, and title visibility are changed in one file for both normal and attention items.

**Priority:** P2

## Logic Placement and Flow Predictability

### Finding: Model publication flows through invisible UI delegates

**Evidence:** `main.qml:354-431` uses a hidden normal-task `Repeater` with zero size and `visible: false`; its delegate builds `taskInfo`, computes `qualifies`, and calls `root.publishNormalTask(...)` from lifecycle and role-change handlers; `main.qml:434-480` repeats the pattern for remote attention and tracks `becameQualified` in delegate-local state.

**Current state:** `TasksModel` rows are observed through invisible UI delegates. Delegates normalize roles, decide qualification, publish into root-owned maps, and root recomposes arrays for visible UI.

**Design concern:** State transitions depend on QML delegate lifecycle side effects. The flow requires jumping between hidden delegates, root mutation helpers, and pure logic modules to understand add/update/remove sequencing.

**Correct end state:** A named model adapter/source should own observation and publication. If QML delegates are required for role access, they should be internal to that adapter and expose explicit events or snapshots.

**Suggested migration:** Extract the hidden repeater blocks and publication state into `NormalTaskSource.qml` and `RemoteAttentionSource.qml` or a combined controller component. Keep existing JS helpers unchanged at first.

**Acceptance criteria:** `main.qml` no longer contains hidden repeaters for publication; row add/update/remove sequencing is testable or replayable through a controller API; visible UI consumes an explicit composed model.

**Priority:** P1

### Finding: Interaction logic lives directly in visual delegates

**Evidence:** `TaskItem.qml:154-167` constructs drag MIME data inline; `TaskItem.qml:169-205` parses drop data, checks acceptance, mutates `dropHover`, and emits `taskDropped`; `TaskItem.qml:215-253` uses a zero-interval timer for context-menu focus and request emission; `AttentionItem.qml:110-148` duplicates the menu-key/right-click timer and request pattern; `main.qml:561-564` accepts a drop only after `root.moveTask(...)` succeeds.

**Current state:** Pointer, keyboard, drag payload, drop acceptance, focus timing, and context-menu request construction live inside QML event handlers.

**Design concern:** Simple policies such as malformed drag data, self-drop rejection, missing `canDropTask`, and context-menu request payloads require Qt event simulation or source-regex tests instead of pure tests.

**Correct end state:** A small interaction helper should own MIME payload creation/parsing, drop acceptance decisions, and context-menu request payload construction. A shared QML component should translate Qt events into helper calls.

**Suggested migration:** Extract pure helpers for `dragMimeData(...)`, `dropSourceIndex(...)`, `canAcceptDrop(...)`, and `contextMenuRequest(...)`. Then replace duplicated timer/request blocks with a reusable interaction component while preserving the current zero-delay behavior.

**Acceptance criteria:** Unit tests cover invalid drop payloads, self-drops, missing drop callback, accepted drops, and context-menu request payloads without Qt event simulation; `TaskItem.qml` and `AttentionItem.qml` no longer duplicate the menu timer/request block.

**Priority:** P2

### Finding: Scope decisions are split between model configuration and local qualification

**Evidence:** Normal `TasksModel` sets `filterByActivity: true` and `filterByVirtualDesktop: true` in `main.qml:321-324`; attention `TasksModel` sets both false in `main.qml:345-348`; normal delegates still run `TaskModelLogic.qualifiesNormalTask(...)` in `main.qml:403`; attention delegates run `RemoteAttentionLogic.qualifiesRemoteAttention(...)` in `main.qml:460`.

**Current state:** Some rows are filtered by upstream model settings before local logic sees them, while local qualifiers duplicate or complement that filter policy.

**Design concern:** This may be intentionally defensive, but the intended contract is not named. Future changes to current-screen, activity, or virtual-desktop scope must synchronize QML model settings and JS qualifiers manually.

**Correct end state:** Scope policy should expose both model filter settings and post-filter qualification semantics for normal and remote attention paths.

**Suggested migration:** Add scope-policy helpers/constants and bind QML model filters through them. Add tests that assert normal and remote model settings match the local qualification contract.

**Acceptance criteria:** Scope choices have one named owner; `main.qml` does not contain unexplained raw model filter booleans; tests cover both model settings and qualifier behavior.

**Priority:** P2

## Testability Problems

### Finding: Core state transitions require live QML model lifecycle

**Evidence:** `main.qml:196-263` owns normal and remote publication maps/order and snapshot application; `main.qml:354-480` mutates those maps through hidden repeater lifecycle callbacks; `main.qml:44-65` resolves activation and calls `tasksModel.requestActivate(...)`.

**Current state:** Pure modules cover pieces of task composition and remote attention, but end-to-end behavior such as stale removal, publication-key replacement, `Meta+0` targeting, and interaction between normal tasks and remote attention requires a live QML applet or simulated `TasksModel` repeaters.

**Design concern:** Important behavior is too coupled to QML lifecycle timing. Tests can cover helper functions, but not the actual controller state transitions without bootstrapping the applet.

**Correct end state:** A pure controller should accept events such as `normalTaskPublished`, `normalTaskRemoved`, `remoteAttentionPublished`, `remoteAttentionRemoved`, `launcherListChanged`, and `activityChanged`, and return updated snapshots plus effect commands.

**Suggested migration:** Extract activation target selection first. Then extract map/order updates around normal and remote publication. Keep QML repeaters initially as event emitters into the controller.

**Acceptance criteria:** Unit tests can replay publication/removal/attention qualification sequences without QML; `Meta+1` through `Meta+9` and `Meta+0` selection are covered by unit tests; `main.qml` stores a controller snapshot rather than ad hoc mutable maps.

**Priority:** P1

### Finding: QML behavior is guarded by source-regex tests

**Evidence:** `tests/taskvisuallogic.test.mjs:126-206` reads QML and asserts source patterns; `tests/taskitempresentationlogic.test.mjs:81-130` reads `NumberBadge.qml`, `TaskItem.qml`, and `main.qml`; `tests/taskmetricslogic.test.mjs:30-66` reads QML source; `tests/taskcontextmenulogic.test.mjs:65-117` parses `TaskContextMenu.qml` text; `README.md:36-37` still calls out manual Plasma verification for shortcut delivery, launch-in-place behavior, drag/drop ordering, and remote-attention activation.

**Current state:** Pure JS helpers have behavioral tests, but QML integration and remaining policy are often tested through source inspection.

**Design concern:** Regex tests are brittle under harmless structure changes and can pass while behavior changes. They also reveal that some policy still lacks a behavioral boundary outside QML runtime objects.

**Correct end state:** Policies currently asserted by QML text tests should move into pure helpers or typed adapter functions with behavioral tests. Source-structure checks should remain only for QML runtime constraints that cannot be expressed behaviorally, such as Plasma menu content restrictions.

**Suggested migration:** For each `readFileSync()` QML assertion, classify it as policy or structural constraint. Move policy tests first: title visibility, slot sizing inputs, frame state mapping, delegate request construction, and menu action state.

**Acceptance criteria:** Most QML source-text tests are replaced by tests against pure helper outputs; remaining source tests document the exact QML runtime limitation they protect; manual verification remains for Plasma integration only.

**Priority:** P2

## Error Handling and Observability Problems

### Finding: User actions fail as silent no-ops

**Evidence:** `main.qml:44-65` returns silently for empty lists, out-of-range shortcut targets, invalid model indexes, and activation request calls; `main.qml:104-121` ignores false results from `requestAddLauncher(...)` and `requestRemoveLauncher(...)`; `main.qml:266-282` returns silently for invalid context-menu requests and `createObject(...)` failure; `TaskContextMenu.qml:291-535` directly calls `requestNewInstance`, move/resize/toggle, desktop/activity, and close actions without capturing outcomes.

**Current state:** User-triggered activation, menu, pin/unpin, and window management requests either execute or disappear. Expected no-op, stale model index, API rejection, and component creation failure are indistinguishable.

**Design concern:** Production behavior is hard to debug. A broken shortcut, stale delegate, rejected Plasma request, or failed menu creation all look the same to users and maintainers.

**Correct end state:** Side-effect methods should return or emit structured action results such as `{ ok, action, code, context }`. Expected no-ops can stay quiet, but internal failures should log enough context to identify task, launcher URL, source model, and action.

**Suggested migration:** Add a small diagnostic helper in root/controller code. Wrap activation, context-menu creation, launcher pinning, and then context-menu task requests one family at a time. Keep UI components emitting intent.

**Acceptance criteria:** Invalid/stale activation attempts produce structured internal diagnostics; failed menu creation logs action and model-index context; false launcher mutation results are distinguishable from unchanged state; tests cover at least one rejected action result.

**Priority:** P1

### Finding: Launcher and move failures lack reason codes

**Evidence:** See `TaskModelLogic.js:240-289` and `LauncherListLogic.js:186-339` for collapsed false/null results, plus `TaskItem.qml:178-188` and `main.qml:561-564` where drag/drop only receives boolean accept/reject.

**Current state:** Callers cannot tell policy rejection from stale state or invalid inputs.

**Design concern:** Without reason codes, observability and tests cannot distinguish benign ignored drops from real internal problems.

**Correct end state:** Mutation helpers should return typed results with stable reason codes and callers should log unexpected reasons.

**Suggested migration:** Add `reason` fields while preserving existing `moved` booleans, then migrate callers and tests.

**Acceptance criteria:** Movement and launcher activity failures have distinct tested reasons; drag/drop rejection can be diagnosed without reproducing QML events.

**Priority:** P2

## Deletion, Modularity, and Abstraction Problems

### Finding: Remote attention is not cleanly removable

**Evidence:** Remote attention state is stored in `main.qml:28-32`; activation is special-cased in `main.qml:44-47` and implemented in `main.qml:258-264`; publication state and snapshot application live in `main.qml:225-255`; the attention model is defined in `main.qml:342-352`; hidden publication delegates are in `main.qml:434-480`; sizing/rendering/menu wiring references attention state in `main.qml:489-493` and `main.qml:571-595`; remote attention policy is described as a separate path in `docs/architecture/ARCHITECTURE.md:96-102`.

**Current state:** Remote attention is conceptually separate but implemented across root state, hidden model delegates, activation, layout sizing, rendering, and menu wiring.

**Design concern:** Removing or changing remote attention requires edits across most of `main.qml`, increasing change impact and making normal task behavior harder to reason about independently.

**Correct end state:** Remote attention should have one owner, such as `RemoteAttentionSource.qml`, containing `attentionTasksModel`, publication state, target/count snapshot, and activation intent. `main.qml` should consume `visible`, `count`, `target`, item descriptor, and action signals.

**Suggested migration:** Extract the attention `TasksModel` and hidden repeater into a source component first. Bind `AttentionItem` to that source. Then replace the root activation special case with activation through the composed visible item model.

**Acceptance criteria:** Remote attention can be removed by deleting one source component and one rendered binding; `main.qml` no longer has `remoteAttentionEntryMap`, `remoteAttentionOrder`, `publishRemoteAttention()`, or `removeRemoteAttention()`; `Meta+0` behavior is expressed through composed visible item order.

**Priority:** P1

### Finding: Generic helper facades obscure ownership

**Evidence:** `TaskActivityLogic.js:4-28` and `LauncherListLogic.js:4-70` expose generic activity primitives already owned by `ActivityScopeLogic.js`; `TaskModelLogic.js:4-78` and `RemoteAttentionLogic.js:4-33` accept a broad `taskEntryLogic` object rather than explicit dependencies.

**Current state:** Some modules are used both as domain-specific owners and pass-through facades for lower-level primitives.

**Design concern:** Imports do not clearly communicate ownership. A developer can change activity or entry semantics through a facade while other consumers continue using the original module.

**Correct end state:** Generic primitives should have one public owner. Higher-level modules should expose only their domain-specific decisions and depend on lower-level helpers through explicit imports or named dependencies.

**Suggested migration:** Replace facade imports at call sites with `ActivityScopeLogic` imports for generic activity checks. Remove generic re-exports from task and launcher modules. Remove runtime-injected helper namespaces from task-entry factories.

**Acceptance criteria:** Generic activity semantics are tested only through `activityscopelogic.test.mjs`; task and launcher modules export only task- or launcher-specific decisions; entry factories have explicit dependency surfaces.

**Priority:** P3

## Recommended Correct End-State Architecture

The correct end state is not a large framework. It is a clearer split between platform adapters, pure domain/controller logic, and QML rendering.

- **Platform adapters:** `main.qml` owns Plasma object instantiation only where QML requires it: `TaskManager.TasksModel`, `ActivityInfo`, `VirtualDesktopInfo`, and menu creation. It should translate platform signals into controller events and execute controller effect commands.
- **Task entry projection:** `TaskEntryLogic.js` owns role projection, launcher URL precedence, fallback constants, model-index validity, and diagnostics for malformed required roles.
- **Activity and scope policy:** `ActivityScopeLogic.js` owns generic activity semantics. A `TaskScopeLogic.js` or equivalent owns normal/remote model filter settings and local qualification policy.
- **Launcher and pin state:** `LauncherListLogic.js` owns launcher serialization, launcher activity mutation, visible launcher position, and widget pin membership. Context menu state consumes explicit `isPinned` and `canPin` fields.
- **Normal task source:** A normal task controller/source owns publication keys, normal task map/order, manual unpinned order, pinned-prefix composition, and reorder operations.
- **Remote attention source:** A remote attention source owns its model, qualification, ordering, count, target snapshot, and activation intent.
- **Visible item composer:** A pure composer owns the final visible sequence, slot numbers, `Meta+0` target, item type, model source, and sizing count.
- **Context-menu action model:** `TaskContextMenuLogic.js` or focused section helpers own role snapshot normalization, action visibility/enabled/checked state, labels, and typed action descriptors. QML renders sections and dispatches effects.
- **Effects and diagnostics:** Activation, launcher writes, context-menu creation, and task requests return structured results. Expected no-ops are quiet; stale data, rejected writes, and component failures emit diagnostics with action and context.
- **Shared task chrome:** A reusable QML component owns task-like frame, icon/title layout, highlight state, activation/menu event wiring, and context-menu request mechanics. `TaskItem` and `AttentionItem` provide variant badges, drag/drop, and defaults.
- **Tests:** Pure tests cover entry projection, scope policy, launcher/pin state, normal composition, remote attention, visible item composition, action models, interaction helpers, mutation reason codes, and diagnostics. QML source tests remain only for genuine QML runtime constraints.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior: pin/unpin menu state, launcher activity all-activities handling, `Meta+1` through `Meta+9`, `Meta+0` with and without remote attention, launcher sync update paths, and current drag/drop rejection behavior.
2. Centralize duplicated rules/state: create visible slot/order policy, normalize launcher activity menu state, move pin membership into one helper/state, centralize launcher URL extraction and fallback constants, and move metrics constants into a named owner.
3. Isolate core domain logic from external effects: extract activation target resolution, normal task publication/order updates, remote attention source state, and launcher sync result computation into pure or mostly pure helpers.
4. Clarify ownership boundaries: split `main.qml` into composition plus focused sources/controllers; move context-menu action state into a tested action model; introduce shared task-like chrome for `TaskItem` and `AttentionItem`.
5. Improve error semantics and observability: add structured result objects and reason codes for activation, menu creation, launcher writes, task requests, move/reorder decisions, and role projection diagnostics.
6. Remove or simplify premature abstractions: remove generic activity re-exports after consumers import `ActivityScopeLogic` directly; remove injected `taskEntryLogic` namespaces; delete or document unused entry fields such as `hasAnyLauncher`.

## Things Not To Change Yet

- Do not replace KDE Plasma's `org.kde.taskmanager` APIs or implement window discovery/activation from scratch.
- Do not change visible user behavior while extracting owners. Preserve pinned order, launch-in-place behavior, per-window tasks, remote attention placement, and current `Meta+0` semantics unless a characterization test proves a bug.
- Do not introduce a large framework, global state manager, or generic event bus. The target architecture should remain boring QML plus small tested JavaScript modules.
- Do not remove source-regex tests until the protected policy has behavioral tests or the regex is confirmed to guard a real QML runtime constraint.
- Do not add a settings UI, grouped tasks, migration system, notification integration, or exact KDE task-manager parity as part of this refactoring.
- Do not optimize for backward compatibility or data migration unless a future task explicitly requests it; this package is pre-release.

## Appendix: Subagent Reports

### Single Source of Truth / Duplication Agent

Findings accepted and merged: slot numbering policy, task metrics constants, task role normalization/fallback policy, and visibility scope duplication. Slot numbering was merged into the visible item composer finding and elevated to P1 because it affects the core shortcut contract. Metrics, role normalization, and scope policy remain P2. No evidence-backed finding was rejected.

### Invariant / Correctness Agent

Findings accepted and merged: competing pin state definitions, launcher activity all-activities normalization, and separated visible order/shortcut projections. Pin state was elevated to a top P1 risk because it can choose the wrong Pin/Unpin action. Launcher activity normalization is P2. Visible order and shortcut projection was merged with slot policy.

### Cohesion / Coupling / Ownership Agent

Findings accepted and merged: `main.qml` as god object, context menu ownership, activity helper facades, broad task-entry helper injection, and duplicated task-like delegate behavior. Root and menu ownership are P1/P1 in the consolidated review. Activity facades are P3 because they are cleanup after higher-risk ownership work.

### Logic Placement / Flow Readability Agent

Findings accepted and merged: invisible delegates publish model state, context-menu state policy in the view, and shortcut target resolution in root QML. These were merged into the root controller, context-menu action model, and visible item composer findings.

### Testability Agent

Findings accepted and merged: context-menu policy locked inside Plasma menu, root applet state requiring QML lifecycle, interaction behavior embedded in delegates, and QML source-regex tests. The first two are P1 because they block reliable characterization of core behavior. Interaction and regex-test issues are P2.

### Error Handling / Observability Agent

Findings accepted and merged: silent user-action no-ops, over-generalized move/launcher failures, launcher sync without failure-safe recovery, and role coercion without provenance. Launcher sync and silent action results are P1. Mutation reason codes and role diagnostics are P2.

### Deletion / Modularity / Abstraction Agent

Findings accepted and merged: remote attention not cleanly removable, duplicated task-like delegate chrome, context-menu feature boundaries, and loose task-entry schema/runtime-injected dependencies. Remote attention removability is P1 because it is interwoven with root activation, layout, and model publication. Delegate chrome and schema cleanup are P2.

### Rejected Or Uncertain Items

No subagent finding was rejected outright. Two items should be treated with extra care during implementation: scope duplication may partly be intentional protection against upstream `TasksModel` behavior, so the first change should name and test the contract rather than remove checks; the apparently unused `hasAnyLauncher` field is evidence of a loose schema, but deleting it should wait until the new schema owner confirms no external QML consumer exists.
