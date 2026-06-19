# Design Review: Correct End State

<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

## Executive Summary

The codebase has a strong existing direction: external behavior is specified in `docs/spec/SPEC.md`, architectural intent is documented in `docs/architecture/ARCHITECTURE.md`, and most domain decisions already have pure `.mjs` helpers with focused tests. The most important remaining design risks are not a lack of architecture, but several places where the current implementation has outgrown its boundaries.

The highest-impact risks are around action/effect boundaries. Desktop actions and footer actions bypass the structured action-result path used by the rest of the task actions.

The second major risk is module breadth. `TaskContextMenuLogic.mjs`, `TaskActionLogic.mjs`, and `LauncherListLogic.mjs` each contain multiple feature families. That makes local changes harder to reason about and pushes tests toward very large suites or regex assertions against QML instead of executable behavior tests.

The correct end state should keep the current behavioral design, KDE Plasma API usage, native menu approach, and pure-helper strategy. The target is narrower ownership: domain rules live in one pure owner, QML components wire platform effects through explicit ports, and every user action that crosses into Plasma or KIO has a structured result path.

## Top Design Risks

1. **High-change modules own too many feature families.** `TaskContextMenuLogic.mjs`, `TaskActionLogic.mjs`, and `LauncherListLogic.mjs` mix unrelated policies, which increases blast radius and makes deletion or isolated testing harder.
2. **Several effect boundaries are hard to test or observe.** Hidden QML source delegates own publication lifecycle transitions, standalone launcher sync diagnostics still use a separate warning formatter, and C++ desktop actions create live `QAction`/`KIO::ApplicationLauncherJob` objects without a pure descriptor or failure signal.
3. **Broad raw model ports make feature removal harder.** The same `TasksModel` instance still flows into context menu role/opening paths and launcher sync, while launcher pin/unpin commands, context-menu task commands, context-menu launcher state reads, normal task activation, and task movement now use narrow ports.

## Single Source of Truth Violations

### Finding: Error serialization is duplicated and too lossy

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` defines `actionErrorMessage(...)`; `LauncherListLogic.mjs` defines `launcherWriteErrorMessage(...)`; activation, context-menu task execution, and launcher mutation failures store only `context.error`.

**Current state:** Caught exceptions are reduced to `error.message` or `String(error)` in two modules.

**Design concern:** Message-only warnings are often insufficient for QML/JS production failures, especially when multiple effects share codes like `request-threw`. The duplicated serializers can also drift.

**Correct end state:** A shared error helper should produce bounded structured context such as `errorMessage`, `errorName`, `errorCode`, `fileName`, `lineNumber`, and optionally a trimmed stack. Launcher sync and action execution should use the same shape.

**Suggested migration:** Introduce `ErrorContextLogic.mjs` or include the helper in a small generic result module. Keep the legacy `error` field temporarily for log compatibility, then migrate tests and formatting to structured fields.

**Acceptance criteria:** All caught exceptions use one serializer. Tests cover `Error`, non-`Error` thrown values, and objects with `code`. Launcher write failures and action failures expose the same error context shape.

## Invariant and Correctness Risks

## Cohesion, Coupling, and Ownership Problems

### Finding: `TaskContextMenuLogic.mjs` is a feature monolith

**Priority:** P1.

**Evidence:** `TaskContextMenuActionSectionsLogic.mjs` composes focused window-action, virtual-desktop action, pin-action, launcher-activity, and task-activity owners into the aggregate `contextMenuActionSections(...)` output; `TaskContextMenuLogic.mjs` owns panel placement, platform snapshots, and the QML-visible action-section facade; `TaskContextMenuRoleLogic.mjs` owns live role snapshotting; `TaskContextMenu.qml` consumes one aggregate `contextMenuActionSections(...)`; `tests/taskcontextmenulogic.test.mjs` remains much larger than other logic tests because it still carries broad context-menu wiring assertions.

**Current state:** Role snapshotting, action-family descriptors, routes, and aggregate action-section composition have focused owners. `TaskContextMenuLogic.mjs` remains the QML-visible facade for aggregate action sections and still owns platform snapshot helpers.

**Design concern:** A change to launcher activity behavior, task role snapshotting, menu labels/icons, virtual desktop checked state, or route descriptors lands in the same module. Removing one menu feature requires auditing unrelated policy.

**Correct end state:** Split pure menu policy by ownership. `TaskContextMenuRoleLogic.mjs` should own role reads and snapshots. Focused action-family owners should own labels, icons, visibility, enabled, checked state, commands, and updates. `TaskContextMenuActionSectionsLogic.mjs` should own final aggregate section assembly only. `TaskContextMenuLogic.mjs` should remain a thin QML-visible facade for aggregate section assembly and a platform snapshot helper owner.

**Suggested migration:** Keep footer actions as a separate descriptor/action-result checkpoint. Continue reducing broad context-menu wiring assertions only after executable behavior tests exist for the same contracts.

**Acceptance criteria:** `TaskContextMenuLogic.mjs` no longer imports launcher list mutation helpers and task activity mutation helpers together. Each menu feature family has focused pure tests. `contextMenuActionSections(...)` is an assembly function, not the owner of per-action policy.

### Finding: `TaskActionLogic.mjs` is an overly broad action service

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` defines the generic action-result shape, activation request/execution classification, context-menu open/create classification, context-menu dispatch and launcher-activity failure classification, task-model request/execution classification, launcher mutation classification, task-entry diagnostic adaptation, and drag-move diagnostic policy; it is imported by `TaskActivationAdapter.qml`, `LauncherCommandAdapter.qml`, `TaskContextMenuAdapter.qml`, `TaskMoveAdapter.qml`, `TaskEntryDiagnosticReporter.qml`, and `TaskActionResultLogger.qml`.

**Current state:** A single module is both the generic result formatter and the owner of domain-specific policies for unrelated workflows.

**Design concern:** Activation, launcher mutation, context-menu dispatch, task-entry diagnostics, and drag/drop rejection are coupled through one broad service. Consumers transitively depend on domains they do not use.

**Correct end state:** Keep a small generic `ActionResultLogic.mjs` with result shape, error context, and logging predicate. Move domain-specific classification next to the workflow that uses it: activation logic near `TaskActivationAdapter.qml`, context-menu request and dispatch logic near the context-menu subsystem, launcher mutation logic near `LauncherCommandAdapter.qml`, and drag rejection policy near task move/drag logic.

**Suggested migration:** Extract the generic result factory first. Move activation helpers next, then context-menu helpers, then launcher mutation helpers, then drag rejection helpers. Update imports in QML adapters incrementally.

**Acceptance criteria:** No single module contains activation, context-menu, launcher mutation, task-entry diagnostic, and drag/drop diagnostic policy together. `TaskActionResultLogger.qml` imports only the generic result/logging helper.

### Finding: Adapters depend on broad live `TasksModel` objects

**Priority:** P1.

**Evidence:** `main.qml` still passes the same `tasksModel` into launcher sync and context-menu role/opening paths; `LauncherCommandAdapter.qml` now uses `LauncherCommandPort.qml` for add/remove/list access; `TaskContextMenuTaskCommandAdapter.qml` now uses `TaskCommandPort.qml` for supported context-menu task request execution; context-menu launcher state reads now use `LauncherReadPort.qml`; normal task activation now uses `TaskActivationPort.qml`; task movement now uses `TaskMovePort.qml` for launcher-list and launcher-position reads; `LauncherSyncAdapter.qml` reads and writes `taskModel.launcherList`.

**Current state:** Several adapters still receive the full Plasma `TasksModel` and use different slices of its API.

**Design concern:** The boundaries between task effects, launcher effects, launcher persistence, and menu commands are implicit. Tests must mock a large live object shape, and feature deletion requires searching broad model usage.

**Correct end state:** Use narrow ports around the raw Plasma model. A task command executor should expose explicit supported task request methods. A launcher port should expose launcher list, position, activities, add/remove, and list write operations. A sync owner should handle config persistence. The raw `TasksModel` should be contained at root/platform wiring boundaries.

**Suggested migration:** Introduce wrapper ports without changing behavior. Context-menu task requests now have an explicit allowlist and a narrow task-command port, launcher pin/unpin commands now use a narrow add/remove/list port, context-menu launcher state reads now use a narrow read port, normal task activation now uses a narrow activation port, and task movement now uses a narrow move port; continue by wrapping sync and role/opening paths. Finally update adapters to depend on those wrappers.

**Acceptance criteria:** No adapter except the root/platform adapter receives raw `TasksModel` for unrelated purposes. Context-menu task execution has an explicit supported-method map. Unit tests can mock each port with only the methods that feature uses.

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

### Finding: Context-menu command execution has a narrow port

**Priority:** P2.

**Evidence:** `TaskActionLogic.mjs` validates context-menu task request names against an explicit supported-method allowlist, and `TaskContextMenuTaskCommandAdapter.qml` executes supported context-menu task request methods through `TaskCommandPort.qml`.

**Current state:** The command path uses an explicit supported command map and a narrow task-command port while preserving existing descriptor names.

**Design concern:** This specific dynamic-dispatch and raw task-command adapter risk is closed. The broader raw-model-port concern remains for other adapters and context-menu role/opening paths.

**Correct end state:** Context-menu task commands should continue to execute through a narrow task-command port that exposes only the supported Plasma request methods and argument shapes.

**Suggested migration:** Keep future context-menu task command changes on the task-command port boundary so the adapter does not regain unrelated `TasksModel` API surface.

**Acceptance criteria:** The task command adapter depends on a task-command port that can be mocked with only supported request methods. Unsupported command names remain structured diagnostics before any Plasma method lookup.

## Testability Problems

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

### Finding: Action-result formatting is split between action and sync paths

**Priority:** P2.

**Evidence:** `TaskActionResultLogger.qml` formats action results as `Numbered Task Manager action ...`; `LauncherSyncAdapter.qml` formats launcher sync failures separately with `console.warn("Numbered Task Manager launcher sync ...")`.

**Current state:** Launcher command persistence results are action-shaped and include the launcher action plus sync code. Standalone launcher sync failures still use a separate warning path.

**Design concern:** Related failures can still be split across different log formats and ownership boundaries when sync runs outside a launcher command.

**Correct end state:** There should be one diagnostic representation for standalone action and sync failures, with specialized action or sync fields as context. Formatting can remain in separate thin adapters if necessary, but classification and correlation should be structured.

**Suggested migration:** Decide whether standalone sync warnings should become structured action results, typed sync results consumed by a logger, or a shared diagnostic logger.

**Acceptance criteria:** Standalone launcher sync failures and action failures share classification and formatting policy instead of duplicating broad adapter warning logic.

## Deletion, Modularity, and Abstraction Problems

### Finding: Context-menu features are hard to remove independently

**Priority:** P1.

**Evidence:** `TaskContextMenuActionSectionsLogic.mjs` contains section composition while composing focused virtual-desktop action, window-action, pin-action, launcher-activity, and task-activity owners; `TaskContextMenuRoleLogic.mjs` contains role snapshots; `TaskContextMenu.qml` consumes one aggregate `actionSections`; `TaskContextMenuLogic.mjs` keeps only the QML-visible action-section facade, panel placement, and platform entry snapshots.

**Current state:** Virtual desktop actions, pin actions, route helpers, window actions, launcher activity actions, task activity actions, and aggregate action-section composition have focused owners. Runtime QML still consumes one aggregate menu section facade, and footer actions remain inline.

**Design concern:** Feature boundaries are unclear, and unrelated menu behavior can regress during deletion or feature changes.

**Correct end state:** Each menu feature family should have a focused pure module and focused tests. A top-level composer may assemble sections, but it should not own per-action policy.

**Suggested migration:** Continue with footer action descriptor/action-result ownership after QML and focused tests consume the extracted owners directly.

**Acceptance criteria:** Removing launcher activity code does not touch window action, virtual desktop, or role snapshot modules. Each extracted feature family has a focused test file.

### Finding: Launcher features are interwoven through a broad launcher module

**Priority:** P2.

**Evidence:** `LauncherListLogic.mjs` still combines activity serialization, activity updates, pin visibility, visible position, and pinned reordering; call sites include platform state, context-menu launcher activity paths, and task movement. Sync/reconciliation policy now lives in `LauncherSyncLogic.mjs`.

**Current state:** Launcher feature families are grouped by noun rather than ownership.

**Design concern:** Removing launcher activity menu behavior still requires auditing code used by unrelated drag and pin state paths.

**Correct end state:** Keep the launcher domain boundary, but split responsibility modules for serialization/activity scope, pin visibility, and pinned reordering if the domain module remains too broad.

**Suggested migration:** Extract activity serialization/update helpers if they remain large. Leave re-exports temporarily to reduce churn.

**Acceptance criteria:** Runtime adapters import only the launcher responsibility they execute. Tests can fail independently for serialized activity updates, pin state, and pinned reordering.

### Finding: Broad raw model ports make feature removal harder

**Priority:** P1.

**Evidence:** The same `TasksModel` instance still flows into context menu role/opening paths and launcher sync. Launcher pin/unpin commands, context-menu task commands, context-menu launcher state reads, normal task activation, and task movement now use narrow ports.

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

**Suggested migration:** Defer until after P1/P2 action, effect-boundary, and invariant work.

**Acceptance criteria:** No visual shell refactor happens before higher-priority behavior boundaries are covered by tests.

## Recommended Correct End-State Architecture

The root `main.qml` should remain the composition root. It should instantiate Plasma `TasksModel`, platform state, adapters, sources, and the rendered `TaskListRepresentation.qml`, but it should not own domain policy beyond unavoidable wiring.

Domain rules should live in focused pure modules. Activity rules stay in `ActivityScopeLogic.mjs`. Launcher sync policy lives in `LauncherSyncLogic.mjs`; remaining launcher domain rules should split further only where ownership remains broad. Context-menu feature families should have focused pure modules.

State definitions should be explicit descriptors rather than multi-field conventions. Context-menu routes and command kinds should be centralized constants or typed helpers.

Validation should happen before effects.

External effects should be isolated behind narrow ports. Raw `TasksModel` should be wrapped by task command, launcher command/repository, launcher sync, and activation ports. C++ desktop action resolution should produce descriptors before constructing `QAction` objects or launching `KIO` jobs. QML adapters should supply ports and execute returned commands.

Errors should be represented through one structured diagnostic shape. The generic result helper should define result shape, structured error context, and logging predicate. Domain-specific result classifiers should live near their workflow. Launcher sync and action execution should share error serialization and produce correlated diagnostics for user actions.

Tests should be layered by risk. Characterization tests should pin current behavior first. Pure domain tests should cover launcher sync orchestration through fake ports. QML tests should focus on wiring and effect adapter boundaries. C++ backend tests should cover desktop action descriptors and launch failure observability without requiring real KIO job execution.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior.
2. Centralize duplicated rules/state. Centralize context-menu route kinds.
3. Isolate core domain logic from external effects. Add a desktop action descriptor seam in the C++ backend and continue moving remaining raw-model adapters behind narrow ports.
4. Clarify ownership boundaries. Split `TaskContextMenuLogic.mjs` by feature family, split `TaskActionLogic.mjs` into generic result and domain-specific classifiers, and split remaining broad launcher-domain responsibilities if they keep coupling unrelated features.
5. Improve error semantics and observability. Add structured error context and connect desktop action launch failures to diagnostics.
6. Remove or simplify premature abstractions. After the behavior boundaries are stable, consider extracting `TaskLikeItemShell.qml` if the duplicated visual shell still creates real maintenance pressure. Keep compatibility re-exports only temporarily and remove them once QML and tests consume focused modules directly.

## Things Not To Change Yet

- Do not replace KDE Plasma `TasksModel` usage or implement custom window discovery; the current architecture correctly builds on Plasma APIs.
- Do not collapse remote attention into the normal numbered model; the spec explicitly keeps remote attention outside normal slots.
- Do not replace the Plasma-native context menu with a long-lived Qt Quick Controls popup; current architecture intentionally uses native menus.
- Do not start with a broad rewrite of `TaskContextMenu.qml`; extract pure policy modules first and keep QML rendering behavior stable.
- Do not introduce backward-compatibility migrations for pre-release user data unless separately requested.
- Do not add a settings UI while fixing architecture; it is out of scope for v1 and would add configuration surface before invariants are tightened.
- Do not optimize or abstract the visual shell before action/effect correctness concerns are covered.
- Do not remove existing regex/source-shape QML tests until executable behavior tests exist for the same contracts.

## Progress Log

- P1/P2 launcher sync/domain ownership: Moved config/model sync diffing, convergence, retry classification, reconciliation state, and transaction guard policy from `LauncherListLogic.mjs` into `LauncherSyncLogic.mjs`; `LauncherListLogic.mjs` now keeps launcher-list domain helpers while `LauncherSyncLogic.mjs` owns sync primitives and orchestration. Verified with `node tests/launchersynclogic.test.mjs`, `node tests/launcherlistlogic.test.mjs`, and `node tests/launchersyncadapterqml.test.mjs`. Commit: `ae0c7a1`, `0538185`.

## Appendix: Subagent Reports

**Single Source of Truth / Duplication Agent:** Reported repeated context-menu route-kind strings. This was merged into “Single Source of Truth Violations.”

**Cohesion / Coupling / Ownership Agent:** Reported `TaskContextMenuLogic.mjs` as a god module, `TaskActionLogic.mjs` as a broad service, and `LauncherListLogic.mjs` mixing sync/domain rules. The sync/domain split is complete; the broad context-menu module remains P1, and action-result plus remaining launcher-domain splits are P2.

**Logic Placement / Flow Readability Agent:** Reported implicit `visualParent.contextMenuOpen` mutation. It was kept.

**Testability Agent:** Reported desktop action backend lacking a descriptor seam, launcher sync orchestration living in QML, and footer menu actions bypassing descriptors/action results. Launcher sync orchestration is now covered through `LauncherSyncLogic.mjs`; desktop actions and footer actions remain P2.

**Error Handling / Observability Agent:** Reported lossy exception serialization and unobserved desktop action launch failures. Both were kept.

**Deletion / Modularity / Abstraction Agent:** Reported context-menu monolith, partial task-like visual shell abstraction, broad launcher list module, and adapters depending on raw model objects. These were merged into cohesion/modularity sections; the sync part of the launcher module concern is complete. The task-like visual shell item was downgraded to P3 because it is a cleanup/refinement after behavior boundaries are stabilized.

**Rejected or deferred findings:** No subagent finding was rejected for lack of code evidence. Visual shell extraction was deferred because the current duplication is smaller and less risky than action/effect boundary issues. A big rewrite of context menu QML, raw model plumbing, or source delegates is explicitly not recommended; the migration should proceed through characterization tests and narrow extracted owners.
