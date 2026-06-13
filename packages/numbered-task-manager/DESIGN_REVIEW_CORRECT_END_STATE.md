# Design Review: Correct End State

<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

## Executive Summary

The codebase has a strong existing direction: external behavior is specified in `docs/spec/SPEC.md`, architectural intent is documented in `docs/architecture/ARCHITECTURE.md`, and most domain decisions already have pure `.mjs` helpers with focused tests. The most important remaining design risks are not a lack of architecture, but several places where the current implementation has outgrown its boundaries.

The highest-impact risks are around action/effect boundaries. Context-menu action descriptors can remain executable even when their rendered menu items are disabled or hidden. Model-index shape is diagnosed as malformed but still treated as actionable. Desktop actions and footer actions bypass the structured action-result path used by the rest of the task actions.

The second major risk is weakly centralized invariants. Model-index shape is diagnosed as malformed but still treated as actionable, visible-item descriptors rely on matching string fields that are not validated, virtual desktop identity is implemented twice, and source/model kind strings are repeated across activation, diagnostics, and composition code.

The third major risk is module breadth. `TaskContextMenuLogic.mjs`, `TaskActionLogic.mjs`, and `LauncherListLogic.mjs` each contain multiple feature families. That makes local changes harder to reason about and pushes tests toward very large suites or regex assertions against QML instead of executable behavior tests.

The correct end state should keep the current behavioral design, KDE Plasma API usage, native menu approach, and pure-helper strategy. The target is narrower ownership: domain rules live in one pure owner, QML components wire platform effects through explicit ports, and every user action that crosses into Plasma or KIO has a structured result path.

## Top Design Risks

1. **Context-menu commandability is not centrally protected.** `TaskContextMenuLogic.mjs` attaches commands to disabled or invisible actions, and `TaskContextMenuActionDispatcher.qml` dispatches by route without checking action availability.
2. **Core descriptor invariants are implicit.** `TaskEntryLogic.hasValidModelIndex({})` returns true while diagnostics report `unknown-model-index-shape`, and activation routing trusts `sourceModel` even when it could disagree with visible-item `kind`.
3. **High-change modules own too many feature families.** `TaskContextMenuLogic.mjs`, `TaskActionLogic.mjs`, and `LauncherListLogic.mjs` mix unrelated policies, which increases blast radius and makes deletion or isolated testing harder.
4. **Several effect boundaries are hard to test or observe.** Hidden QML source delegates own publication lifecycle transitions, launcher sync orchestration is mostly QML imperative code, and C++ desktop actions create live `QAction`/`KIO::ApplicationLauncherJob` objects without a pure descriptor or failure signal.
5. **Broad raw model ports make feature removal harder.** The same `TasksModel` instance flows into activation, context menu, launcher commands, launcher sync, task movement, launcher activity, and task command adapters.

## Single Source of Truth Violations

### Finding: Virtual desktop identity is implemented twice

**Priority:** P2.

**Evidence:** `package/contents/ui/TaskEntryLogic.mjs` defines `desktopId(...)`, `desktopListContains(...)`, `isOnCurrentVirtualDesktop(...)`, and `isRemoteVirtualDesktop(...)`; `package/contents/ui/TaskContextMenuLogic.mjs` defines equivalent `virtualDesktopId(...)` and `virtualDesktopListContains(...)`; `package/contents/ui/TaskScopeLogic.mjs` imports desktop membership from `TaskEntryLogic.mjs`; `TaskContextMenuLogic.mjs` uses its duplicate helpers in `virtualDesktopMenuState(...)`.

**Current state:** Task qualification and context-menu checked-state use separate virtual desktop normalization logic. The implementations currently match, but they are independent definitions.

**Design concern:** If KDE exposes a different virtual desktop object shape or the project tightens identity coercion, source qualification and context-menu checked state can drift.

**Correct end state:** One focused owner should define desktop identity and membership. The cleanest end state is a `VirtualDesktopLogic.mjs` module that owns ID coercion, list membership, current-desktop qualification, remote-desktop qualification, and menu checked-state primitives. `TaskEntryLogic.mjs` should stay focused on task entry projection.

**Suggested migration:** Add characterization tests that show current task-scope and menu checked-state behavior is identical. Move `desktopId(...)` and `desktopListContains(...)` into the shared owner. Update `TaskScopeLogic.mjs` and `TaskContextMenuLogic.mjs` to import the shared helpers. Keep compatibility exports only during migration.

**Acceptance criteria:** Only one production implementation converts virtual desktop objects or strings to IDs. Task scope tests and context-menu checked-state tests both use the shared helper. A desktop identity behavior change requires one code edit.

### Finding: Numbered slot limit is duplicated

**Priority:** P2.

**Evidence:** `package/contents/ui/VisibleTaskItemsLogic.mjs` defines `normalSlotLimit = 9` and uses it in `normalSlotNumberForIndex(...)`; `package/contents/ui/TaskItemPresentationLogic.mjs` hard-codes `number <= 9` in `validSlotNumber(...)`.

**Current state:** Visible item composition decides which normal items are numbered through one constant, while number presentation independently validates slot labels through a separate literal.

**Design concern:** A future slot policy change could make activation/composition and rendering disagree.

**Correct end state:** Slot numbering policy should have one owner. `VisibleTaskItemsLogic.mjs` can own the limit and validation helpers, or a small `TaskNumberingLogic.mjs` can own `normalSlotLimit`, `metaZeroShortcutIndex`, `normalSlotNumberForIndex(...)`, and `validSlotNumber(...)`.

**Suggested migration:** Export slot validation from the numbering owner. Import it from `TaskItemPresentationLogic.mjs`. Keep presentation logic responsible only for `none`, `prefix`, and `overlay` rendering decisions.

**Acceptance criteria:** `TaskItemPresentationLogic.mjs` has no hard-coded numbered-slot limit. Composition and presentation tests fail together if the slot limit changes.

### Finding: Task source and visible-item kind strings are repeated

**Priority:** P2.

**Evidence:** `VisibleTaskItemsLogic.mjs` emits `kind: "normal"`, `sourceModel: "normal"`, `kind: "remoteAttention"`, and `sourceModel: "remoteAttention"`; `TaskActionLogic.mjs` hard-codes those names in shortcut activation validation; `TaskActivationAdapter.qml` routes on `"remoteAttention"`; `NormalTaskSource.qml` and `RemoteAttentionSource.qml` repeat `"normal"` and `"remoteAttention"` for diagnostics.

**Current state:** Source identities are an implicit string protocol shared across visible-item composition, activation validation, activation target routing, and diagnostic source reporting.

**Design concern:** Adding a new task-like source or renaming an existing one requires coordinated edits across several files. A typo can route activation or diagnostics incorrectly.

**Correct end state:** One schema module should own task-like source identities and visible-item kinds. `VisibleTaskItemsLogic.mjs` is a reasonable owner if it remains the descriptor composer; otherwise create a small descriptor schema module.

**Suggested migration:** Export constants and helper predicates such as `normalItemKind`, `remoteAttentionItemKind`, `isNormalVisibleItem(...)`, and `isRemoteAttentionVisibleItem(...)`. Replace production string comparisons where QML import mechanics allow it. For QML call sites that cannot easily import constants, centralize validation in pure helpers before effects execute.

**Acceptance criteria:** Routing and descriptor validation do not independently spell `"normal"` or `"remoteAttention"` outside the shared owner. Activation tests cover routing through the shared helper or constants.

### Finding: Context-menu route kinds are an implicit enum

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` creates launcher commands with `kind: "launcher-command"` and task commands with `kind: "task-model-request"`; `TaskContextMenuLogic.mjs` classifies routes with `"launcher-activity-update"`, `"none"`, `"launcher-command"`, and `"task-model-request"`; `TaskContextMenuActionDispatcher.qml` dispatches by comparing the same literals.

**Current state:** Command factories, route classification, and dispatch share route strings by convention.

**Design concern:** Adding or renaming a route can produce runtime-only `unknown-route` failures because there is no single route-kind owner.

**Correct end state:** The context-menu subsystem should own route-kind constants and helper predicates. Ideally, command descriptor construction moves out of the generic action-result module and into a context-menu command module.

**Suggested migration:** Add route-kind constants in the context-menu route owner. Replace dispatcher comparisons with constants or helper predicates. Move context-menu command factories out of `TaskActionLogic.mjs` when the action-result split happens.

**Acceptance criteria:** Each route kind is declared once. The dispatcher has no raw route-kind string literals. Command factories and route classification use the same exported definitions.

### Finding: Error serialization is duplicated and too lossy

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` defines `actionErrorMessage(...)`; `LauncherListLogic.mjs` defines `launcherWriteErrorMessage(...)`; activation, context-menu task execution, and launcher mutation failures store only `context.error`.

**Current state:** Caught exceptions are reduced to `error.message` or `String(error)` in two modules.

**Design concern:** Message-only warnings are often insufficient for QML/JS production failures, especially when multiple effects share codes like `request-threw`. The duplicated serializers can also drift.

**Correct end state:** A shared error helper should produce bounded structured context such as `errorMessage`, `errorName`, `errorCode`, `fileName`, `lineNumber`, and optionally a trimmed stack. Launcher sync and action execution should use the same shape.

**Suggested migration:** Introduce `ErrorContextLogic.mjs` or include the helper in a small generic result module. Keep the legacy `error` field temporarily for log compatibility, then migrate tests and formatting to structured fields.

**Acceptance criteria:** All caught exceptions use one serializer. Tests cover `Error`, non-`Error` thrown values, and objects with `code`. Launcher write failures and action failures expose the same error context shape.

## Invariant and Correctness Risks

### Finding: Launcher pin/unpin reports success while persistence can fail

**Priority:** P1.

**Evidence:** `package/contents/ui/LauncherCommandAdapter.qml` calls `taskModel.requestAddLauncher(...)` and `taskModel.requestRemoveLauncher(...)` in `pinLauncher(...)` and `unpinLauncher(...)`; `requestLauncherMutation(...)` now captures `launcherSync.persistLaunchers(taskModel.launcherList)` and routes `ok: false` sync results through `TaskActionLogic.launcherMutationPersistenceResult(...)`; `LauncherSyncAdapter.qml` returns structured convergence results from `persistLaunchers(...)`; `LauncherListLogic.mjs` can produce `ok: false` with `code: "write-mismatch"` or `code: "write-failed"`.

**Current state:** Pin/unpin now has one user-visible outcome channel. Model request failures remain action results, and configuration persistence failures are converted into structured launcher-command failures by `LauncherCommandAdapter.qml`.

**Design concern:** The remaining launcher-sync orchestration still lives in QML, and retry/observability behavior is still encoded in string comparisons and broad warning paths.

**Correct end state:** Launcher command execution should produce one structured outcome for the whole pin/unpin command. `LauncherCommandAdapter.qml` should combine model request result and persistence result, or delegate the full transaction to a launcher command/sync owner that returns a single typed result.

**Suggested migration:** Keep future launcher-sync cleanup on the same structured result boundary so pin/unpin does not regress to a silent-success path.

**Acceptance criteria:** `pinLauncher(...)` and `unpinLauncher(...)` return or emit failure when persistence fails. Tests cover request failure, request rejection, accepted model mutation plus failed config convergence, missing `launcherSync`, and full success. No call site ignores an `ok: false` launcher persistence result.

### Finding: Disabled or invisible context-menu actions remain executable

**Priority:** P1.

**Evidence:** `TaskContextMenuLogic.mjs` functions such as `newInstanceAction(...)`, `basicResizeAction(...)`, and `shadeAction(...)` attach commands regardless of enabled/visible state; `contextMenuActionRoute(...)` routes solely by `update` or `command`; `TaskContextMenuActionDispatcher.qml` dispatches without checking `enabled` or `visible`.

**Current state:** Availability is enforced by rendered `PlasmaExtras.MenuItem` `enabled` and `visible` properties, not by the action descriptor or dispatcher.

**Design concern:** The rule “unavailable actions cannot execute” is protected opportunistically at the UI layer. Tests of routing cannot prove that unavailable action states are non-actionable, and stale menu state can still dispatch a command if passed directly.

**Correct end state:** Commandability should be part of the descriptor/routing contract. Unavailable descriptors should either omit commands/updates or be centrally rejected by the dispatcher with a structured result such as `action-disabled` or `action-hidden`.

**Suggested migration:** Add tests that pass disabled resize, hidden activity, and unavailable launcher-activity descriptors into `contextMenuActionRoute(...)` or `triggerAction(...)`. Then either remove commands from unavailable descriptors or add a central availability check before route dispatch.

**Acceptance criteria:** A disabled or invisible task-model action cannot reach `TaskContextMenuTaskCommandAdapter.requestTaskModelCommand(...)`. A disabled or invisible launcher activity action cannot request a launcher-list replacement. Rejections are structured results, not silent reliance on QML rendering behavior.

### Finding: Model-index shape is both malformed and actionable

**Priority:** P1.

**Evidence:** `TaskEntryLogic.modelIndexState(...)` now names `modelIndex.valid === undefined` as `unknown-shape`, and the actionability policy still allows that state for activation and context-menu effects until the real Plasma persistent model-index shape is confirmed.

**Current state:** A model-index object with no `valid` property is explicitly classified as `unknown-shape` and remains accepted for activation and context-menu effects under a named preservation policy.

**Design concern:** The model-index invariant is split between “diagnose” and “allow effects.” That makes stale or malformed model-index handling dependent on which boundary sees the object first.

**Correct end state:** `TaskEntryLogic.mjs` should own one explicit model-index contract with states such as `missing`, `valid`, `invalid`, and `unknown-shape`. If `unknown-shape` must remain actionable for Plasma runtime reasons, that must be a named policy outcome rather than simply “valid.”

**Suggested migration:** Add `modelIndexState(modelIndex)`. Migrate diagnostics and action request checks to consume it. Preserve runtime behavior initially if needed, but update tests so `{}` is not asserted as simply valid without naming the unknown-shape policy. Confirm the real `makePersistentModelIndex(...)` shape in Plasma before tightening rejection.

**Acceptance criteria:** One helper classifies model-index state. Diagnostics and effect boundaries no longer disagree on the same shape. Activation and context-menu tests cover missing, invalid, valid, and unknown-shape indexes.

### Finding: Visible-item descriptors can route activation to the wrong model

**Priority:** P2.

**Evidence:** `VisibleTaskItemsLogic.mjs` emits descriptors with both `kind` and `sourceModel`; `TaskActionLogic.shortcutActivationRequest(...)` validates `kind` but not the relationship between `kind` and `sourceModel`; `TaskActivationAdapter.qml` selects `remoteAttentionSource` when `result.sourceModel === "remoteAttention"`.

**Current state:** The composer creates consistent descriptors, but the action boundary accepts mismatched descriptors such as `kind: "normal"` with `sourceModel: "remoteAttention"`.

**Design concern:** Activation correctness depends on a multi-field descriptor convention that is not validated at the boundary.

**Correct end state:** Visible-item metadata should be a validated discriminated shape. Activation should derive `sourceModel` from `kind` or reject descriptors whose `kind`, `sourceModel`, `sourceIndex`, `numbered`, and `slotNumber` are inconsistent.

**Suggested migration:** Add `validateVisibleItemDescriptor(...)` in `VisibleTaskItemsLogic.mjs` or a descriptor schema module. Use it in shortcut activation and remote-attention activation before selecting an activation target.

**Acceptance criteria:** Mismatched `kind`/`sourceModel` combinations are rejected before any `requestActivate(...)`. The composer remains the single producer of valid descriptors, and action boundaries validate externally supplied descriptors.

### Finding: Drag move stale-state failures can disappear silently

**Priority:** P2.

**Evidence:** `TaskMoveAdapter.qml` emits an action result when initial `canMoveTaskResult(...)` rejects a move; after a passing check, it calls `normalTaskEntryForSourceIndex(...)` for source and target and returns `false` without an action result if either lookup fails; `TaskModelLogic.canMoveTaskResult(...)` already has `missing-source` and `missing-target` reasons; `TaskActionLogic.dragMoveRejectionResult(...)` treats stale reasons as diagnostic.

**Current state:** A race between drag acceptance and drop execution can produce an unclassified false return.

**Design concern:** The code already has a diagnostic vocabulary for stale drag state, but one execution path bypasses it. That weakens production debugging for model churn during drag/drop.

**Correct end state:** Every failed drag execution path that is not an expected quiet no-op should emit a structured drag move rejection.

**Suggested migration:** Recompute a typed move decision immediately before returning `false`, or map missing post-check source/target to `dragMoveRejectionResult({ canMove: false, reason: "missing-source" | "missing-target" }, sourceIndex, targetIndex)`.

**Acceptance criteria:** If source or target disappears during `moveTask(...)`, an action result is emitted. Expected denials such as same index, boundary crossing, and pinned-launcher denial remain non-diagnostic. `moveTask(...)` has no unclassified stale-state `return false`.

## Cohesion, Coupling, and Ownership Problems

### Finding: `TaskContextMenuLogic.mjs` is a feature monolith

**Priority:** P1.

**Evidence:** `TaskContextMenuLogic.mjs` imports `TaskActionLogic.mjs`, `ActivityScopeLogic.mjs`, `TaskActivityLogic.mjs`, and `LauncherListLogic.mjs`; it owns panel placement, platform snapshots, pin actions, launcher activity updates, task activity actions, virtual desktop actions, action route classification, and section aggregation; `TaskContextMenuRoleLogic.mjs` now owns live role snapshotting; `TaskContextMenu.qml` consumes one aggregate `contextMenuActionSections(...)`; `tests/taskcontextmenulogic.test.mjs` remains much larger than other logic tests and exercises many unrelated exports.

**Current state:** Role snapshotting has been extracted into `TaskContextMenuRoleLogic.mjs`, but one module still owns several context-menu feature families and cross-domain concerns.

**Design concern:** A change to launcher activity behavior, task role snapshotting, menu labels/icons, virtual desktop checked state, or route descriptors lands in the same module. Removing one menu feature requires auditing unrelated policy.

**Correct end state:** Split pure menu policy by ownership. `TaskContextMenuRoleLogic.mjs` should own role reads and snapshots. `TaskContextMenuActionSectionsLogic.mjs` should own labels, icons, visibility, enabled, and checked descriptors. `TaskContextMenuLauncherActivityLogic.mjs` should own launcher activity menu state and update descriptors. Virtual desktop primitives should move to the shared virtual desktop owner. A retained `TaskContextMenuLogic.mjs` should be a thin facade or final composer only.

**Suggested migration:** Continue extracting one family at a time. Role snapshots have a focused owner; next candidates include launcher activity helpers, virtual desktop helpers, and task activity helpers. Keep compatibility re-exports while migrating tests.

**Acceptance criteria:** `TaskContextMenuLogic.mjs` no longer imports launcher list mutation helpers and task activity mutation helpers together. Each menu feature family has focused pure tests. `contextMenuActionSections(...)` is an assembly function, not the owner of per-action policy.

### Finding: `TaskActionLogic.mjs` is an overly broad action service

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` defines the generic action-result shape, activation request/execution classification, context-menu open/create classification, context-menu dispatch and launcher-activity failure classification, task-model request/execution classification, launcher mutation classification, task-entry diagnostic adaptation, and drag-move diagnostic policy; it is imported by `TaskActivationAdapter.qml`, `LauncherCommandAdapter.qml`, `TaskContextMenuAdapter.qml`, `TaskMoveAdapter.qml`, `TaskEntryDiagnosticReporter.qml`, and `TaskActionResultLogger.qml`.

**Current state:** A single module is both the generic result formatter and the owner of domain-specific policies for unrelated workflows.

**Design concern:** Activation, launcher mutation, context-menu dispatch, task-entry diagnostics, and drag/drop rejection are coupled through one broad service. Consumers transitively depend on domains they do not use.

**Correct end state:** Keep a small generic `ActionResultLogic.mjs` with result shape, error context, and logging predicate. Move domain-specific classification next to the workflow that uses it: activation logic near `TaskActivationAdapter.qml`, context-menu request and dispatch logic near the context-menu subsystem, launcher mutation logic near `LauncherCommandAdapter.qml`, and drag rejection policy near task move/drag logic.

**Suggested migration:** Extract the generic result factory first. Move activation helpers next, then context-menu helpers, then launcher mutation helpers, then drag rejection helpers. Update imports in QML adapters incrementally.

**Acceptance criteria:** No single module contains activation, context-menu, launcher mutation, task-entry diagnostic, and drag/drop diagnostic policy together. `TaskActionResultLogger.qml` imports only the generic result/logging helper.

### Finding: `LauncherListLogic.mjs` mixes domain rules and synchronization policy

**Priority:** P2.

**Evidence:** `LauncherListLogic.mjs` owns launcher-list normalization, model/config update diffing, convergence results, transaction guard mutation, reconciliation retry state, serialized activity prefixes, activity toggles, pin visibility, visible launcher position, and pinned launcher reordering; consumers include `LauncherSyncAdapter.qml`, `TaskPlatformState.qml`, `NormalTaskSource.qml`, `TaskContextMenuLogic.mjs`, and `TaskMoveAdapter.qml`.

**Current state:** Pure launcher-list transformations and operational write/reconciliation policy live in one broad module.

**Design concern:** Changing sync behavior touches the module used by drag reordering, context-menu activity updates, and platform pin visibility. The transaction helper mutates a passed QML object, which differs from the pure style used elsewhere in the module.

**Correct end state:** Split launcher responsibilities. `LauncherListLogic.mjs` should own domain transformations such as serialization, activity visibility, pin state, visible position, activity updates, and pinned reordering. `LauncherSyncLogic.mjs` should own config/model diffs, convergence results, retry classification, reconciliation state, and transaction guard policy. Runtime adapters should import only the responsibility they execute.

**Suggested migration:** Extract sync/reconciliation helpers first because `LauncherSyncAdapter.qml` is the only intended consumer. Leave serialization, pin state, visible position, and reorder helpers in launcher domain logic. Split tests by sync, serialization/activity, pin state, and reorder behavior.

**Acceptance criteria:** `LauncherSyncAdapter.qml` imports no pin/reorder/activity menu functions. `TaskMoveAdapter.qml` imports no sync/reconciliation functions. No pure launcher-list helper mutates a passed QML object.

### Finding: Adapters depend on broad live `TasksModel` objects

**Priority:** P1.

**Evidence:** `main.qml` passes the same `tasksModel` as `taskModel` and `launcherModel`; `LauncherCommandAdapter.qml` calls `requestAddLauncher(...)`, `requestRemoveLauncher(...)`, and reads `launcherList`; `LauncherSyncAdapter.qml` reads and writes `taskModel.launcherList`; `TaskMoveAdapter.qml` reads `taskModel.launcherList` and calls `launcherPosition(...)`; `TaskContextMenuLauncherActivityAdapter.qml` calls `launcherModel.launcherActivities(...)`; `TaskContextMenuTaskCommandAdapter.qml` now uses an explicit supported-method map, but still receives the raw task model for context-menu task requests.

**Current state:** Several adapters receive the full Plasma `TasksModel` and use different slices of its API.

**Design concern:** The boundaries between task effects, launcher effects, launcher persistence, and menu commands are implicit. Tests must mock a large live object shape, and feature deletion requires searching broad model usage.

**Correct end state:** Use narrow ports around the raw Plasma model. A task command executor should expose explicit supported task request methods. A launcher port should expose launcher list, position, activities, add/remove, and list write operations. A sync owner should handle config persistence. The raw `TasksModel` should be contained at root/platform wiring boundaries.

**Suggested migration:** Introduce wrapper ports without changing behavior. Context-menu task requests now have an explicit allowlist; continue by wrapping launcher model access used by pin/activity/reorder code. Finally update adapters to depend on those wrappers.

**Acceptance criteria:** No adapter except the root/platform adapter receives raw `TasksModel` for unrelated purposes. Context-menu task execution has an explicit supported-method map. Unit tests can mock each port with only the methods that feature uses.

### Finding: Normal task source bypasses its injected launcher-position boundary

**Priority:** P2.

**Evidence:** `main.qml` passes `launcherRevision` and `visibleLauncherPosition` into `NormalTaskSource`; `NormalTaskSource.qml` defines `launcherPositionForUrl(...)` to call that injected callback; the delegate still imports `LauncherListLogic.mjs` and computes `launcherPinState(...)` directly from `root.taskModel.launcherList`, `root.currentActivity`, and `root.taskModel.launcherPosition(...)`; `TaskPlatformState.qml` already owns `visibleLauncherPosition(...)`.

**Current state:** `NormalTaskSource` has an injected platform-owned visible launcher API but does not use it for launcher pin projection.

**Design concern:** Launcher visibility and pin membership are split across `TaskPlatformState`, `NormalTaskSource`, `LauncherListLogic`, and `NormalTaskStoreAdapter`. Initial source publication and later store recomposition can drift if launcher-position semantics change.

**Correct end state:** `TaskPlatformState` should remain the QML owner of platform-backed visible launcher lookup. `NormalTaskSource` should use its injected `visibleLauncherPosition` callback, or receive a fully formed launcher pin snapshot from a dedicated adapter. It should not directly read `taskModel.launcherList` for this policy.

**Suggested migration:** Replace direct `LauncherListLogic.launcherPinState(...)` in `NormalTaskSource.qml` with `launcherPositionForUrl(launcherUrl, launcherRevisionToken)`. Derive `launcherPinned` from `launcherPosition !== -1`. Remove the now-unused `LauncherListLogic` import.

**Acceptance criteria:** `NormalTaskSource.qml` no longer imports `LauncherListLogic.mjs`. Source-published `launcherPosition` and store-recomputed launcher position use the same callback semantics. Tests cover launcher revision/current-activity changes without relying on an ignored extra argument to `launcherPinState(...)`.

## Logic Placement and Flow Predictability

### Finding: Menu-open visual state is mutated through an implicit `visualParent` side effect

**Priority:** P2.

**Evidence:** `TaskContextMenuAdapter.qml` checks `visualParent.contextMenuOpen !== undefined`, sets it true, and connects `menu.closed` to set it false; `TaskItem.qml` and `AttentionItem.qml` own `contextMenuOpen`; `TaskLikeInteraction.qml` computes `highlighted` from hover, focus, and `contextMenuOpen`.

**Current state:** The context-menu adapter mutates a property on whichever visual object was passed as `visualParent`.

**Design concern:** This creates hidden coupling between controller-style menu creation and visual delegate internals. Renaming the property or passing a different visual parent silently changes highlight behavior.

**Correct end state:** Menu-open state should be explicit at the task-like interaction boundary. The adapter should emit lifecycle signals or accept typed callbacks; the delegate or `TaskLikeInteraction` should own `contextMenuOpen` mutation in response.

**Suggested migration:** Add explicit `contextMenuOpened` and `contextMenuClosed` signals, or pass a typed callback in the context-menu request. Move mutation into `TaskLikeInteraction`, `TaskItem`, and `AttentionItem`. Keep `TaskContextMenuAdapter.qml` responsible only for validation, menu creation, signal wiring, and `show()`.

**Acceptance criteria:** `TaskContextMenuAdapter.qml` no longer reads or writes `visualParent.contextMenuOpen`. Delegates still highlight while their menu is open. The lifecycle path is visible through named signals or callbacks.

### Finding: Footer menu actions bypass descriptors and action-result classification

**Priority:** P2.

**Evidence:** `TaskContextMenu.qml` has an unconditional footer separator, reads `Plasmoid.internalAction("configure")` and `Plasmoid.containment.internalAction("configure")` directly, and calls `.trigger()` directly for both footer actions.

**Current state:** Most task actions flow through descriptors, dispatch adapters, and action results. Footer actions are handled inline in the QML menu.

**Design concern:** Footer visibility and execution are not covered by the same policy/test boundary as the rest of the menu. Missing or thrown footer actions are not classified.

**Correct end state:** Footer actions should have descriptor state in a context-menu/footer helper. A small QML adapter should trigger the Plasma internal action and convert missing or thrown triggers into structured action results.

**Suggested migration:** Add footer descriptor helpers for configure, edit mode, and footer separator visibility. Bind QML to descriptors and route clicks through a footer action adapter. Keep `Plasmoid.internalAction(...)` lookup in QML as the effect source.

**Acceptance criteria:** Footer separator visibility and footer action state are covered by `.mjs` tests. `TaskContextMenu.qml` no longer directly calls `.trigger()`. Missing configure/edit actions produce structured no-op or diagnostic results.

### Finding: Context-menu command execution still lacks a narrow port

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` validates context-menu task request names against an explicit supported-method allowlist, and `TaskContextMenuTaskCommandAdapter.qml` executes supported `TasksModel.request*` calls through explicit branches.

**Current state:** The command path uses an explicit supported command map while preserving existing descriptor names.

**Design concern:** This specific dynamic-dispatch risk is closed. The broader raw-model-port concern remains because the adapter still receives the raw task model rather than a narrow task-command port.

**Correct end state:** Context-menu task commands should be executed through a narrow task-command port that exposes only the supported Plasma request methods and argument shapes.

**Suggested migration:** Keep the explicit command executor helper, then wrap the raw task model behind a task-command port so the adapter no longer receives unrelated `TasksModel` API surface.

**Acceptance criteria:** The task command adapter depends on a task-command port that can be mocked with only supported request methods. Unsupported command names remain structured diagnostics before any Plasma method lookup.

## Testability Problems

### Finding: Task source publication lifecycle depends on hidden QML delegate events

**Priority:** P1.

**Evidence:** `NormalTaskSource.qml` uses a hidden `Repeater` over `root.taskModel`, allocates publication keys in `Component.onCompleted`, removes keys in `Component.onDestruction`, and republishes through several `on*Changed` handlers; `RemoteAttentionSource.qml` uses the same hidden delegate pattern and computes `becameQualified` from delegate-local `hasSyncedAttention` and `previousQualifies`; source QML tests mostly assert structure by reading files with regex.

**Current state:** Entry projection and final store mutations are pure-tested, but the lifecycle that decides row appeared, row changed, row key changed, row qualified/unqualified, row removed, and remote attention became newly qualified lives in QML delegate event ordering.

**Design concern:** Remote attention target order and normal task publication depend on QML lifecycle behavior that is hard to test deterministically without a QML runtime and fake `TasksModel`.

**Correct end state:** Source lifecycle should be represented as tested controller/state transitions in `.mjs`: row appeared, row changed, row key changed, qualification changed, row removed, and diagnostics emitted. QML delegates should project live roles into snapshots and forward lifecycle events to that controller.

**Suggested migration:** Extract per-row source state machines for normal tasks and remote attention. Move “allocate or reuse key,” “emit publish/remove command,” “became qualified,” and “emit diagnostics command” decisions into pure functions. Let QML execute returned commands.

**Acceptance criteria:** Normal publication lifecycle is tested without QML delegate lifecycle. Remote attention `becameQualified` and target ordering are tested from row-event sequences. QML source files no longer hold transition state beyond raw projected role values.

### Finding: Launcher sync write orchestration is trapped in QML effects

**Priority:** P1.

**Evidence:** `LauncherSyncAdapter.qml` computes updates, writes `configuration.launchers`, writes `taskModel.launcherList`, checks convergence, mutates reconciliation state, retries, and logs warnings; `LauncherListLogic.mjs` owns lower-level update and reconciliation helpers; `tests/launchersyncadapterqml.test.mjs` asserts QML source patterns rather than executing write/retry/failure behavior.

**Current state:** Pure update/reconciliation pieces exist, but the sequencing of reads, writes, guard state, convergence checks, retry expiry, and logging is implemented in QML.

**Design concern:** Launcher persistence is operationally important and failure-prone, but current tests cannot execute the full orchestration without Plasma/QML.

**Correct end state:** A sync orchestration helper should accept explicit effect ports: read model launchers, write model launchers, read config launchers, write config launchers, update guard, and emit diagnostics. QML should provide real ports only.

**Suggested migration:** Extract `persistLaunchers`, `applyLauncherList`, and `reconcileLauncherListChange` sequencing into `LauncherSyncLogic.mjs` functions that accept fakeable callbacks or a port object. Keep `LauncherSyncAdapter.qml` as a wrapper. Replace regex-only tests with executable tests for successful writes, config-only writes, model-only writes, thrown setters, non-converged writes, retry once, and retry expiry.

**Acceptance criteria:** Launcher sync retry and convergence behavior is covered by unit tests without QML or Plasma. QML no longer owns model/config write branching. Failures produce structured results before formatting.

### Finding: Desktop action backend has no descriptor seam

**Priority:** P2.

**Evidence:** `src/taskcontextmenubackend.cpp` resolves services in `desktopEntryUrl(...)`, validates desktop files and resolves `KService` in `desktopActions(...)`, creates live `QAction` objects, and connects `QAction::triggered` directly to `new KIO::ApplicationLauncherJob(serviceAction)->start()`; `TaskContextMenu.qml` consumes `contextMenuBackend.desktopActions(...)` as live actions.

**Current state:** Discovery, filtering, presentation object creation, and launch execution are all inside `TaskContextMenuBackend::desktopActions(...)`.

**Design concern:** Desktop action behavior is hard to verify without KDE service databases, filesystem desktop files, Qt action objects, and KIO job execution. The code cannot test “which actions should appear” independently from launch side effects.

**Correct end state:** The backend should have a descriptor boundary. A resolver should map launcher URL to desktop action descriptors, and a launcher should map a descriptor to a `KIO::ApplicationLauncherJob`. `TaskContextMenuBackend` should become a thin adapter that exposes QML-compatible actions or descriptors.

**Suggested migration:** Add an internal descriptor type with text, icon, separator, and stable service payload. Extract service resolution and filtering into testable code with fake inputs. Keep `QAction` construction as the final adapter step.

**Acceptance criteria:** Desktop action filtering can be tested without real KDE service lookup. Launch dispatch can be tested without starting `KIO::ApplicationLauncherJob`. `TaskContextMenuBackend::desktopActions(...)` becomes a thin adapter over tested resolver/descriptor logic.

### Finding: Task-like visual shell is only partially abstracted

**Priority:** P3.

**Evidence:** `TaskItem.qml` and `AttentionItem.qml` both instantiate `TaskLikeFrame`, `TaskLikeContentRow`, `TaskLikeContentSpacer`, `TaskLikeIconSlot`, `TaskLikeTitle`, and `TaskLikeInteraction`; both compute `naturalImplicitWidth`, `titleVisible`, `visualHighlighted`, `implicitWidth`, and `implicitHeight`.

**Current state:** Shared subcomponents exist, but the containing task-like item shell is duplicated between normal task items and remote attention items.

**Design concern:** Common visual behavior such as hover highlighting, context-menu focus, title visibility, frame sizing, and icon metrics must be kept in sync manually.

**Correct end state:** A `TaskLikeItemShell.qml` should own shared frame/content/interaction layout and expose narrow extension points for badge content, frame state, and optional drag/drop. `TaskItem.qml` and `AttentionItem.qml` should provide variant data and adornments only.

**Suggested migration:** Extract only shared non-behavioral bindings first. Keep normal drag/drop in `TaskItem.qml` and attention count badge as variant content. Do this after higher-priority behavior and effect-boundary work.

**Acceptance criteria:** `TaskItem.qml` and `AttentionItem.qml` no longer duplicate the full frame/content/interaction stack. Title visibility and implicit width are computed in one QML owner.

## Error Handling and Observability Problems

### Finding: Desktop action launch failures are unobserved

**Priority:** P2.

**Evidence:** `TaskContextMenuBackend::desktopActions(...)` starts `KIO::ApplicationLauncherJob` in the `QAction::triggered` lambda and does not connect to job result/error signals; `TaskContextMenu.qml` binds desktop action menu items directly through `action: modelData`; lookup failures collapse to an empty action list.

**Current state:** Clicking a backend-created desktop action can fail without a widget-owned diagnostic. The path bypasses `TaskActionResultLogger.qml`.

**Design concern:** Desktop action failures are hard to distinguish from missing actions, disabled menu state, or no-op behavior.

**Correct end state:** Backend-created desktop actions should be observable. `TaskContextMenuBackend` should emit a QML-visible structured result or log through a KDE logging category with launcher URL, desktop entry path, service action identity, and job error details.

**Suggested migration:** Connect `KJob::result` for `ApplicationLauncherJob`. Map nonzero errors to a stable code such as `desktop-action-launch-failed`. Forward the result to `TaskContextMenu.qml` and `TaskActionResultLogger.qml`, or to a backend logging category.

**Acceptance criteria:** Failed desktop action jobs are observable. Logs/results include launcher URL or desktop entry path and service action text/name. Expected empty desktop-action discovery remains quiet.

### Finding: Launcher sync retry semantics are implicit

**Priority:** P2.

**Evidence:** `LauncherListLogic.launcherReconciliationAfterResult(...)` retains reconciliation state only when `syncResult.code === "write-mismatch"`; `runLauncherListUpdateTransaction(...)` converts exceptions to `code: "write-failed"`; `LauncherSyncAdapter.qml` executes retry decisions from those helpers.

**Current state:** Retry policy is encoded as a string comparison. `write-failed` clears pending retry state, and the result does not say whether the failure is retryable or fatal.

**Design concern:** Operators and maintainers cannot tell from a sync result whether the system will retry, wait for another model change, or give up. New failure codes can accidentally bypass retry.

**Correct end state:** Launcher sync results should carry explicit retry classification such as `retryable`, `retryAfterChange`, or `fatal`. Reconciliation should branch on that classification, not raw code strings alone.

**Suggested migration:** Add a retry classification field while preserving existing `code` values. Test `write-mismatch`, `write-failed`, and `reconciliation-expired` classifications. Include retry state in warning output.

**Acceptance criteria:** Every launcher sync failure code has a tested retry classification. `launcherReconciliationAfterResult(...)` no longer depends solely on `code !== "write-mismatch"`.

### Finding: Action-result formatting is split between action and sync paths

**Priority:** P2.

**Evidence:** `TaskActionResultLogger.qml` formats action results as `Numbered Task Manager action ...`; `LauncherSyncAdapter.qml` formats launcher sync failures separately with `console.warn("Numbered Task Manager launcher sync ...")`; launcher command persistence failures are not converted to action results.

**Current state:** There are separate warning paths for user actions and launcher sync failures.

**Design concern:** Related failures can be split across different log formats and ownership boundaries. The launcher command caller cannot correlate pin/unpin with later persistence failure without reading sync logs.

**Correct end state:** There should be one diagnostic representation, with specialized action or sync fields as context. Formatting can remain in separate thin adapters if necessary, but classification and correlation should be structured.

**Suggested migration:** Route failed persistence from launcher commands through action-result context first. Then decide whether sync warnings should become structured action results, typed sync results consumed by a logger, or a shared diagnostic logger.

**Acceptance criteria:** Pin/unpin persistence failure logs include launcher action and sync failure code in one structured diagnostic. Formatting policy is not duplicated between broad adapters.

## Deletion, Modularity, and Abstraction Problems

### Finding: Context-menu features are hard to remove independently

**Priority:** P1.

**Evidence:** `TaskContextMenuLogic.mjs` contains pin actions, launcher activities, task activities, virtual desktops, window actions, route classification, and section composition; `TaskContextMenuRoleLogic.mjs` now contains role snapshots; `TaskContextMenu.qml` consumes one aggregate `actionSections`; `tests/taskcontextmenulogic.test.mjs` imports many unrelated exports from the same module.

**Current state:** Removing launcher activities, virtual desktops, or a window action requires editing and testing a shared monolith.

**Design concern:** Feature boundaries are unclear, and unrelated menu behavior can regress during deletion or feature changes.

**Correct end state:** Each menu feature family should have a focused pure module and focused tests. A top-level composer may assemble sections, but it should not own per-action policy.

**Suggested migration:** Extract one family at a time with compatibility re-exports. Virtual desktop helpers and role snapshots now have focused owners. Continue with launcher activity helpers and other menu families.

**Acceptance criteria:** Removing launcher activity code does not touch window action, virtual desktop, or role snapshot modules. Each feature family has a focused test file.

### Finding: Launcher features are interwoven through a broad launcher module

**Priority:** P2.

**Evidence:** `LauncherListLogic.mjs` combines sync/reconciliation, activity serialization, activity updates, pin visibility, visible position, and pinned reordering; call sites include sync, platform state, source publication, context menu, and task movement.

**Current state:** Launcher feature families are grouped by noun rather than ownership.

**Design concern:** Removing launcher activity menu behavior or changing sync policy requires auditing code used by unrelated drag and pin state paths.

**Correct end state:** Keep the launcher domain boundary, but split responsibility modules: sync/reconciliation, serialization/activity scope, pin visibility, and pinned reordering.

**Suggested migration:** Extract sync first, then activity serialization/update helpers if they remain large. Leave re-exports temporarily to reduce churn.

**Acceptance criteria:** Runtime adapters import only the launcher responsibility they execute. Tests can fail independently for sync, serialized activity updates, pin state, and pinned reordering.

### Finding: Broad raw model ports make feature removal harder

**Priority:** P1.

**Evidence:** The same `TasksModel` instance flows into activation, context menu, launcher commands, launcher sync, task movement, launcher activity, and task command adapters.

**Current state:** Feature ownership is inferred from which object methods an adapter happens to call.

**Design concern:** Deleting or isolating a feature requires searching broad live model usage and mocking a large object shape in tests.

**Correct end state:** Narrow ports should make ownership explicit. Feature-specific adapters should depend on only the methods they need.

**Suggested migration:** Introduce ports while preserving behavior. Avoid a large rewrite; wrap one feature boundary at a time.

**Acceptance criteria:** Unit tests can mock each port with only feature-specific methods. Raw `TasksModel` access is contained near root/platform wiring.

### Finding: Some abstractions should not be extracted yet

**Priority:** P3.

**Evidence:** `TaskItem.qml` and `AttentionItem.qml` duplicate some visual shell structure, but the duplication is small compared with the action/effect boundary issues; existing shared subcomponents already cover `TaskLikeFrame`, `TaskLikeContentRow`, `TaskLikeIconSlot`, `TaskLikeTitle`, and `TaskLikeInteraction`.

**Current state:** The visual shell is partially abstracted.

**Design concern:** Extracting the shell too early could add QML indirection while more important correctness and testability issues remain.

**Correct end state:** Extract a shell only after behavior boundaries are stable and characterization tests protect normal and remote attention visuals.

**Suggested migration:** Defer until after P1/P2 action, sync, and invariant work.

**Acceptance criteria:** No visual shell refactor happens before higher-priority behavior boundaries are covered by tests.

## Recommended Correct End-State Architecture

The root `main.qml` should remain the composition root. It should instantiate Plasma `TasksModel`, platform state, adapters, sources, and the rendered `TaskListRepresentation.qml`, but it should not own domain policy beyond unavoidable wiring.

Domain rules should live in focused pure modules. Activity rules stay in `ActivityScopeLogic.mjs`. Virtual desktop identity and membership should move into a focused virtual desktop owner. Visible-item descriptors, slot numbering, and shortcut target selection should have one descriptor/numbering owner. Launcher domain rules should be split from launcher sync policy. Context-menu feature families should have focused pure modules.

State definitions should be explicit descriptors rather than multi-field conventions. Visible item descriptors should have a validated discriminated shape. Model-index state should have named states instead of a boolean that treats unknown shape as valid. Context-menu routes and command kinds should be centralized constants or typed helpers.

Validation should happen before effects. Activation requests should validate visible-item descriptor consistency and model-index state before choosing a model. Context-menu dispatch should reject disabled or hidden actions before routing. Launcher commands should combine model mutation and persistence outcomes before reporting success.

External effects should be isolated behind narrow ports. Raw `TasksModel` should be wrapped by task command, launcher command/repository, launcher sync, and activation ports. C++ desktop action resolution should produce descriptors before constructing `QAction` objects or launching `KIO` jobs. QML adapters should supply ports and execute returned commands.

Errors should be represented through one structured diagnostic shape. The generic result helper should define result shape, structured error context, and logging predicate. Domain-specific result classifiers should live near their workflow. Launcher sync and action execution should share error serialization and produce correlated diagnostics for user actions.

Tests should be layered by risk. Characterization tests should pin current behavior first. Pure domain tests should cover descriptor invariants, slot numbering, virtual desktop identity, launcher sync orchestration through fake ports, and source lifecycle state machines. QML tests should focus on wiring and effect adapter boundaries. C++ backend tests should cover desktop action descriptors and launch failure observability without requiring real KIO job execution.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior. Prioritize launcher pin/unpin persistence outcomes, disabled context-menu dispatch, model-index unknown-shape policy, visible-item `kind/sourceModel` mismatch, launcher sync retry classification, and source lifecycle transitions.
2. Centralize duplicated rules/state. Move virtual desktop identity into one owner, centralize slot numbering, centralize visible-item/source identity constants, and centralize context-menu route kinds.
3. Isolate core domain logic from external effects. Extract launcher sync orchestration into fakeable pure functions or port-based helpers. Extract source lifecycle state machines from hidden QML delegate event ordering. Add a desktop action descriptor seam in the C++ backend.
4. Clarify ownership boundaries. Split `TaskContextMenuLogic.mjs` by feature family, split `TaskActionLogic.mjs` into generic result and domain-specific classifiers, split launcher sync from launcher list domain rules, and introduce narrow ports around raw `TasksModel`.
5. Improve error semantics and observability. Add structured error context, connect desktop action launch failures to diagnostics, and carry retry classification in launcher sync results.
6. Remove or simplify premature abstractions. After the behavior boundaries are stable, consider extracting `TaskLikeItemShell.qml` if the duplicated visual shell still creates real maintenance pressure. Keep compatibility re-exports only temporarily and remove them once QML and tests consume focused modules directly.

## Things Not To Change Yet

- Do not replace KDE Plasma `TasksModel` usage or implement custom window discovery; the current architecture correctly builds on Plasma APIs.
- Do not collapse remote attention into the normal numbered model; the spec explicitly keeps remote attention outside normal slots.
- Do not replace the Plasma-native context menu with a long-lived Qt Quick Controls popup; current architecture intentionally uses native menus.
- Do not start with a broad rewrite of `TaskContextMenu.qml`; extract pure policy modules first and keep QML rendering behavior stable.
- Do not introduce backward-compatibility migrations for pre-release user data unless separately requested.
- Do not add a settings UI while fixing architecture; it is out of scope for v1 and would add configuration surface before invariants are tightened.
- Do not optimize or abstract the visual shell before action/effect correctness, launcher sync, and descriptor invariants are covered.
- Do not remove existing regex/source-shape QML tests until executable behavior tests exist for the same contracts.

## Appendix: Subagent Reports

**Single Source of Truth / Duplication Agent:** Reported duplicated virtual desktop identity, duplicated slot limit, repeated task source/kind strings, and repeated context-menu route-kind strings. These were merged into “Single Source of Truth Violations.” Virtual desktop duplication was merged with similar cohesion/deletion findings and prioritized as P2 by the main review because it is a drift risk rather than a known current behavior bug.

**Invariant / Correctness Agent:** Reported model-index unknown shape being both diagnostic and actionable, disabled/invisible context-menu actions carrying executable commands, and visible-item descriptor mismatch risk. All three were kept. The first two are P1 because they affect effect-boundary correctness; the descriptor mismatch is P2 because the current composer produces valid descriptors but the boundary is not protected.

**Cohesion / Coupling / Ownership Agent:** Reported `TaskContextMenuLogic.mjs` as a god module, `TaskActionLogic.mjs` as a broad service, duplicated virtual desktop helpers, and `LauncherListLogic.mjs` mixing sync/domain rules. These were merged with deletion/modularity findings. The broad context-menu module remains P1; action-result and launcher-list splits are P2.

**Logic Placement / Flow Readability Agent:** Reported `NormalTaskSource.qml` bypassing its injected launcher-position callback, ignored launcher persistence results, and implicit `visualParent.contextMenuOpen` mutation. All were kept. The persistence result issue was merged with the error-handling report and is P1.

**Testability Agent:** Reported desktop action backend lacking a descriptor seam, launcher sync orchestration living in QML, task source lifecycle depending on delegate events, and footer menu actions bypassing descriptors/action results. These were kept. Launcher sync and source lifecycle are P1 because important behavior is currently hard to execute-test; desktop actions and footer actions are P2.

**Error Handling / Observability Agent:** Reported ignored launcher persistence failures, implicit launcher sync retry semantics, silent stale drag failures, lossy exception serialization, and unobserved desktop action launch failures. All were kept, with duplicate launcher persistence merged into the top P1 finding.

**Deletion / Modularity / Abstraction Agent:** Reported context-menu monolith, virtual desktop duplication, partial task-like visual shell abstraction, broad launcher list module, and adapters depending on raw model objects. These were merged into cohesion/modularity sections. The task-like visual shell item was downgraded to P3 because it is a cleanup/refinement after behavior boundaries are stabilized.

**Rejected or deferred findings:** No subagent finding was rejected for lack of code evidence. Visual shell extraction was deferred because the current duplication is smaller and less risky than action/effect boundary issues. A big rewrite of context menu QML, raw model plumbing, or source delegates is explicitly not recommended; the migration should proceed through characterization tests and narrow extracted owners.
