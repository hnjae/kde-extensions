# Design Review: Correct End State

<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

## Executive Summary

The codebase has a strong existing direction: external behavior is specified in `docs/spec/SPEC.md`, architectural intent is documented in `docs/architecture/ARCHITECTURE.md`, and most domain decisions already have pure `.mjs` helpers with focused tests. The most important remaining design risks are not a lack of architecture, but the few places where executable verification or shared visual structure still lag the intended boundaries.

The highest-impact risks are around action/effect boundaries. Desktop action backend testing still depends on source-shape checks for behavior that should be executable-tested.

The remaining module-breadth risk is lower priority: normal task and remote-attention delegates still duplicate the task-like visual shell around shared subcomponents.

The correct end state should keep the current behavioral design, KDE Plasma API usage, native menu approach, and pure-helper strategy. The target is narrower ownership: domain rules live in one pure owner, QML components wire platform effects through explicit ports, and every user action that crosses into Plasma or KIO has a structured result path.

## Top Design Risks

1. **Some effect boundaries are hard to test with executable fakes.** C++ desktop actions still require live `QAction`/KIO objects for executable verification despite having descriptors and launch-failure diagnostics.
2. **The task-like visual shell is duplicated.** Normal and remote-attention delegates share subcomponents but still duplicate the containing frame/content/interaction stack.

## Invariant and Correctness Risks

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

## Recommended Correct End-State Architecture

The root `main.qml` should remain the composition root. It should instantiate Plasma `TasksModel`, platform state, adapters, sources, and the rendered `TaskListRepresentation.qml`, but it should not own domain policy beyond unavoidable wiring.

Domain rules should live in focused pure modules. Activity rules stay in `ActivityScopeLogic.mjs`. Launcher sync policy lives in `LauncherSyncLogic.mjs`; launcher activity scoping, pin visibility, and structural pinned reordering have focused owners. Context-menu feature families and platform menu helpers have focused pure modules.

State definitions should be explicit descriptors rather than multi-field conventions. Context-menu routes and command kinds should be centralized constants or typed helpers.

Validation should happen before effects.

External effects should be isolated behind narrow ports. Raw `TasksModel` should be wrapped by task command, launcher command/repository, launcher sync, and activation ports. C++ desktop action resolution should produce descriptors before constructing `QAction` objects or launching `KIO` jobs. QML adapters should supply ports and execute returned commands.

Errors should be represented through one structured diagnostic shape. `ErrorContextLogic.mjs` now defines shared structured error context; the generic result helper should still define result shape and logging predicates, while domain-specific result classifiers should live near their workflow. Launcher sync and action execution use the shared serializer and produce correlated diagnostics for user actions.

Tests should be layered by risk. Characterization tests should pin current behavior first. Pure domain tests should cover launcher sync orchestration through fake ports. QML tests should focus on wiring and effect adapter boundaries. C++ backend tests should cover desktop action descriptors and launch dispatch without requiring real KIO job execution.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior.
2. Centralize duplicated rules/state. Centralize context-menu route kinds.
3. Isolate core domain logic from external effects. Add a desktop action descriptor seam in the C++ backend.
4. Clarify ownership boundaries. Keep action-result classifiers in focused workflow owners.
5. Improve error semantics and observability. Keep backend effect failures visible through structured results.
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

**Single Source of Truth / Duplication Agent:** Reported repeated context-menu route-kind strings and duplicated error serialization. Error serialization and route-kind cleanup are complete.

**Cohesion / Coupling / Ownership Agent:** Reported `TaskContextMenuLogic.mjs` as a god module, `TaskActionLogic.mjs` as a broad service, and `LauncherListLogic.mjs` mixing sync/domain rules. These ownership splits are complete.

**Logic Placement / Flow Readability Agent:** Reported implicit `visualParent.contextMenuOpen` mutation. This is complete; menu-open state now flows through explicit lifecycle callbacks owned by delegates.

**Testability Agent:** Reported desktop action backend lacking a descriptor seam, launcher sync orchestration living in QML, and footer menu actions bypassing descriptors/action results. Launcher sync orchestration is now covered through `LauncherSyncLogic.mjs`; footer actions route through descriptors/action results; desktop action descriptors exist but still lack executable fake-input tests.

**Error Handling / Observability Agent:** Reported lossy exception serialization and unobserved desktop action launch failures. Exception serialization, desktop action launch diagnostics, and launcher sync action-result diagnostics are complete; residual backend work is executable fake-input coverage.

**Deletion / Modularity / Abstraction Agent:** Reported context-menu monolith, partial task-like visual shell abstraction, broad launcher list module, and adapters depending on raw model objects. The raw model adapter, broad launcher list, and context-menu monolith concerns are complete. The task-like visual shell item was downgraded to P3 because it is a cleanup/refinement after behavior boundaries are stabilized.

**Rejected or deferred findings:** No subagent finding was rejected for lack of code evidence. Visual shell extraction was deferred because the current duplication is smaller and less risky than action/effect boundary issues. A big rewrite of context menu QML, raw model plumbing, or source delegates is explicitly not recommended; the migration should proceed through characterization tests and narrow extracted owners.
