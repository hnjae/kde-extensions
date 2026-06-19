# Design Review: Correct End State

<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

## Executive Summary

The codebase has a strong existing direction: external behavior is specified in `docs/spec/SPEC.md`, architectural intent is documented in `docs/architecture/ARCHITECTURE.md`, and most domain decisions already have pure `.mjs` helpers with focused tests. The most important remaining design risks are not a lack of architecture, but several places where the current implementation has outgrown its boundaries.

The highest-impact risks are around action/effect boundaries. Footer actions still bypass the structured action-result path used by the rest of the task actions, and desktop action backend testing still depends on source-shape checks for behavior that should be executable-tested.

The second major risk is module breadth. `TaskContextMenuLogic.mjs` and `LauncherListLogic.mjs` still contain multiple feature families. That makes local changes harder to reason about and can push tests toward very large suites or regex assertions against QML instead of executable behavior tests.

The correct end state should keep the current behavioral design, KDE Plasma API usage, native menu approach, and pure-helper strategy. The target is narrower ownership: domain rules live in one pure owner, QML components wire platform effects through explicit ports, and every user action that crosses into Plasma or KIO has a structured result path.

## Top Design Risks

1. **High-change modules own too many feature families.** `TaskContextMenuLogic.mjs` and `LauncherListLogic.mjs` mix unrelated policies, which increases blast radius and makes deletion or isolated testing harder.
2. **Several effect boundaries are hard to test or observe.** Hidden QML source delegates own publication lifecycle transitions, standalone launcher sync diagnostics still use a separate warning formatter, and C++ desktop actions still require live `QAction`/KIO objects for executable verification despite having descriptors and launch-failure diagnostics.

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

## Logic Placement and Flow Predictability

### Finding: Footer menu actions bypass descriptors and action-result classification

**Priority:** P2.

**Evidence:** `TaskContextMenu.qml` has an unconditional footer separator, reads `Plasmoid.internalAction("configure")` and `Plasmoid.containment.internalAction("configure")` directly, and calls `.trigger()` directly for both footer actions.

**Current state:** Most task actions flow through descriptors, dispatch adapters, and action results. Footer actions are handled inline in the QML menu.

**Design concern:** Footer visibility and execution are not covered by the same policy/test boundary as the rest of the menu. Missing or thrown footer actions are not classified.

**Correct end state:** Footer actions should have descriptor state in a context-menu/footer helper. A small QML adapter should trigger the Plasma internal action and convert missing or thrown triggers into structured action results.

**Suggested migration:** Add footer descriptor helpers for configure, edit mode, and footer separator visibility. Bind QML to descriptors and route clicks through a footer action adapter. Keep `Plasmoid.internalAction(...)` lookup in QML as the effect source.

**Acceptance criteria:** Footer separator visibility and footer action state are covered by `.mjs` tests. `TaskContextMenu.qml` no longer directly calls `.trigger()`. Missing configure/edit actions produce structured no-op or diagnostic results.

## Testability Problems

### Finding: Desktop action backend descriptor seam lacks executable fake-input tests

**Priority:** P2.

**Evidence:** `src/taskcontextmenubackend.cpp` now resolves services in `desktopActions(...)`, converts visible `KServiceAction` entries into internal `DesktopActionDescriptor` values, and adapts descriptors into live `QAction` objects that still connect directly to `new KIO::ApplicationLauncherJob(...)->start()`; `tests/taskcontextmenubackendcpp.test.mjs` verifies the source seam but there is no executable C++ test with fake service actions or launch adapters.

**Current state:** Discovery/filtering and `QAction` construction are split in code, but the seam is protected by source-shape tests rather than executable C++ behavior tests.

**Design concern:** Desktop action behavior is still hard to verify without KDE service databases, filesystem desktop files, Qt action objects, and KIO job execution. The code cannot yet test “which actions should appear” or launch dispatch independently from live KDE objects.

**Correct end state:** The descriptor resolver and launch adapter should be executable-tested with fake inputs. `TaskContextMenuBackend` should remain a thin adapter that exposes QML-compatible actions or descriptors over tested resolver/descriptor logic.

**Suggested migration:** Add a C++ test target or another executable test harness for descriptor filtering and launch dispatch. Keep `QAction` construction as the final adapter step.

**Acceptance criteria:** Desktop action filtering can be tested without real KDE service lookup. Launch dispatch can be tested without starting `KIO::ApplicationLauncherJob`.

### Finding: Task-like visual shell is only partially abstracted

**Priority:** P3.

**Evidence:** `TaskItem.qml` and `AttentionItem.qml` both instantiate `TaskLikeFrame`, `TaskLikeContentRow`, `TaskLikeContentSpacer`, `TaskLikeIconSlot`, `TaskLikeTitle`, and `TaskLikeInteraction`; both compute `naturalImplicitWidth`, `titleVisible`, `visualHighlighted`, `implicitWidth`, and `implicitHeight`.

**Current state:** Shared subcomponents exist, but the containing task-like item shell is duplicated between normal task items and remote attention items.

**Design concern:** Common visual behavior such as hover highlighting, context-menu focus, title visibility, frame sizing, and icon metrics must be kept in sync manually.

**Correct end state:** A `TaskLikeItemShell.qml` should own shared frame/content/interaction layout and expose narrow extension points for badge content, frame state, and optional drag/drop. `TaskItem.qml` and `AttentionItem.qml` should provide variant data and adornments only.

**Suggested migration:** Extract only shared non-behavioral bindings first. Keep normal drag/drop in `TaskItem.qml` and attention count badge as variant content. Do this after higher-priority behavior and effect-boundary work.

**Acceptance criteria:** `TaskItem.qml` and `AttentionItem.qml` no longer duplicate the full frame/content/interaction stack. Title visibility and implicit width are computed in one QML owner.

## Error Handling and Observability Problems

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

## Recommended Correct End-State Architecture

The root `main.qml` should remain the composition root. It should instantiate Plasma `TasksModel`, platform state, adapters, sources, and the rendered `TaskListRepresentation.qml`, but it should not own domain policy beyond unavoidable wiring.

Domain rules should live in focused pure modules. Activity rules stay in `ActivityScopeLogic.mjs`. Launcher sync policy lives in `LauncherSyncLogic.mjs`; remaining launcher domain rules should split further only where ownership remains broad. Context-menu feature families should have focused pure modules.

State definitions should be explicit descriptors rather than multi-field conventions. Context-menu routes and command kinds should be centralized constants or typed helpers.

Validation should happen before effects.

External effects should be isolated behind narrow ports. Raw `TasksModel` should be wrapped by task command, launcher command/repository, launcher sync, and activation ports. C++ desktop action resolution should produce descriptors before constructing `QAction` objects or launching `KIO` jobs. QML adapters should supply ports and execute returned commands.

Errors should be represented through one structured diagnostic shape. `ErrorContextLogic.mjs` now defines shared structured error context; the generic result helper should still define result shape and logging predicates, while domain-specific result classifiers should live near their workflow. Launcher sync and action execution should continue to use the shared serializer and produce correlated diagnostics for user actions.

Tests should be layered by risk. Characterization tests should pin current behavior first. Pure domain tests should cover launcher sync orchestration through fake ports. QML tests should focus on wiring and effect adapter boundaries. C++ backend tests should cover desktop action descriptors and launch dispatch without requiring real KIO job execution.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior.
2. Centralize duplicated rules/state. Centralize context-menu route kinds.
3. Isolate core domain logic from external effects. Add a desktop action descriptor seam in the C++ backend.
4. Clarify ownership boundaries. Split `TaskContextMenuLogic.mjs` by feature family, keep action-result classifiers in focused workflow owners, and split remaining broad launcher-domain responsibilities if they keep coupling unrelated features.
5. Improve error semantics and observability. Keep standalone launcher sync diagnostics correlated with action-result formatting, and keep backend effect failures visible through structured results.
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
- P2 context-menu task command boundary: Removed the completed narrow-port finding from the active backlog; the command path already uses explicit supported-method validation and `TaskCommandPort.qml`.
- P2 structured error context: Added `ErrorContextLogic.mjs` as the single serializer for caught action and launcher sync failures, preserving legacy `error` while adding `errorMessage`, `errorName`, and `errorCode` where available. Verified with `node tests/errorcontextlogic.test.mjs`, `node tests/taskactionlogic.test.mjs`, and `node tests/launchersynclogic.test.mjs`. Commit: `b5a053b`, `3eb6a95`.
- P2 explicit menu-open lifecycle: Replaced `TaskContextMenuAdapter.qml` mutation of `visualParent.contextMenuOpen` with request lifecycle callbacks supplied by `NormalTaskItem.qml` and `RemoteAttentionItem.qml`, so delegates own highlight state and the adapter only manages menu validation, creation, signal wiring, and show/close notification. Verified with `node tests/taskcontextmenuadapterqml.test.mjs`, `node tests/normaltaskitemqml.test.mjs`, and `node tests/remoteattentionitemqml.test.mjs`. Commit: `24df7cf`, `6e8108c`.
- P3 premature-abstraction guardrail: Removed the non-actionable “some abstractions should not be extracted yet” item from active findings and kept the guidance in “Things Not To Change Yet,” so the backlog only tracks changes to make.

## Appendix: Subagent Reports

**Single Source of Truth / Duplication Agent:** Reported repeated context-menu route-kind strings and duplicated error serialization. Error serialization is complete; route-kind cleanup remains folded into the broader action/result and context-menu ownership work.

**Cohesion / Coupling / Ownership Agent:** Reported `TaskContextMenuLogic.mjs` as a god module, `TaskActionLogic.mjs` as a broad service, and `LauncherListLogic.mjs` mixing sync/domain rules. The broad action service and sync/domain split are complete; the broad context-menu module remains P1, and remaining launcher-domain splits are P2.

**Logic Placement / Flow Readability Agent:** Reported implicit `visualParent.contextMenuOpen` mutation. This is complete; menu-open state now flows through explicit lifecycle callbacks owned by delegates.

**Testability Agent:** Reported desktop action backend lacking a descriptor seam, launcher sync orchestration living in QML, and footer menu actions bypassing descriptors/action results. Launcher sync orchestration is now covered through `LauncherSyncLogic.mjs`; desktop action descriptors exist but still lack executable fake-input tests, and footer actions remain P2.

**Error Handling / Observability Agent:** Reported lossy exception serialization and unobserved desktop action launch failures. Exception serialization and desktop action launch diagnostics are complete; standalone launcher sync diagnostic formatting remains split from the generic action-result logger.

**Deletion / Modularity / Abstraction Agent:** Reported context-menu monolith, partial task-like visual shell abstraction, broad launcher list module, and adapters depending on raw model objects. The raw model adapter concern is complete; remaining active items are kept in cohesion/modularity sections. The task-like visual shell item was downgraded to P3 because it is a cleanup/refinement after behavior boundaries are stabilized.

**Rejected or deferred findings:** No subagent finding was rejected for lack of code evidence. Visual shell extraction was deferred because the current duplication is smaller and less risky than action/effect boundary issues. A big rewrite of context menu QML, raw model plumbing, or source delegates is explicitly not recommended; the migration should proceed through characterization tests and narrow extracted owners.
