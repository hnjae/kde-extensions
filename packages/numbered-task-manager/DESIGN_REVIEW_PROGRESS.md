<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

# Design Review Progress

## P0/P1 Triage

- P0: none identified in `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P1: competing pin-state ownership; no single visible-order, slot-numbering, and `Meta+0` owner; root-level task-manager controller state in `main.qml`; context-menu policy inside `TaskContextMenu.qml`; launcher sync without failure-safe semantics; user actions failing as silent no-ops; hidden delegate publication flow; remote attention state spread through root.

## Completed Checkpoint 1: Visible Item Composer

- Status: completed.
- What will change: add a tested visible-item composer that owns final visible item order, normal slot numbers, item source metadata, visible count, and shortcut target selection.
- Behavior that must remain unchanged: normal task entries render before the remote-attention item; remote attention remains a single far-right item when present; slots 1 through 9 keep their current labels; tasks after slot 9 remain unnumbered; `Meta+0` targets the final visible item; the remote-attention item remains unbadged.
- Verification: `node tests/visibletaskitemslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just test-host`; `just lint-js-host`; `just test`; `just lint-qml`; `just check`.
- Files changed: `package/contents/ui/VisibleTaskItemsLogic.js`, `package/contents/ui/main.qml`, `tests/visibletaskitemslogic.test.mjs`, `tests/taskvisuallogic.test.mjs`, `docs/architecture/ARCHITECTURE.md`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 2: Shared Pin-State Ownership

- Status: completed.
- What changed: clarified that context-menu Pin/Unpin state reflects this widget's current-activity launcher membership; added `LauncherListLogic.launcherPinState(...)`; added small menu action-state helpers; migrated normal task publication and `TaskContextMenu.qml` Pin/Unpin and launcher-activity visibility to the shared pin state.
- Behavior that must remain unchanged: launcher URL precedence still comes from `LauncherUrlWithoutIcon` before `LauncherUrl`; Pin/Unpin signals and launcher-list writes are still owned by `main.qml`; launcher activity menu ordering and task action ordering are unchanged; launcher-capable but unpinned windows can still be pinned from the task context menu.
- Verification: `node tests/launcherlistlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `just test-host`; `just lint-js-host`; `just test`; `just lint-qml`; `just check`.
- Files changed: `docs/spec/SPEC.md`, `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/LauncherListLogic.js`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/main.qml`, `tests/launcherlistlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 3: Failure-Safe Launcher Sync Guard

- Status: completed.
- What changed: documented launcher-sync ownership; added `LauncherListLogic` transaction and convergence helpers; routed `persistLaunchers()` and `applyLauncherList()` through a guarded transaction that resets `updatingLauncherConfig` after success or caught write failure; logged post-write model/config mismatches with the attempted launcher list.
- Behavior that must remain unchanged: unchanged launcher lists still no-op; pin/unpin still call Plasma launcher add/remove requests before persistence; context-menu launcher activity writes and pinned-launcher drag writes still request the same replacement launcher list; `applyLauncherList()` still returns true after an attempted changed write unless the write action throws.
- Verification: `node tests/launcherlistlogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/LauncherListLogic.js`, `package/contents/ui/main.qml`, `tests/launcherlistlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Planned Checkpoint 4: Activation And Menu Action Results

- Status: planned.
- What will change: add a small tested action-result helper for shortcut activation and context-menu creation, then route root activation/menu code through it so stale inputs and internal failures have stable result codes.
- Behavior that must remain unchanged: invalid shortcuts, stale task indexes, empty remote-attention targets, and failed menu creation still produce no user-visible UI action; valid normal and remote-attention activation still call the same `TasksModel.requestActivate`; context-menu visual-parent state and signal wiring stay unchanged.
- Verification: `node tests/taskactionlogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files likely changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Remaining Follow-Up Work

- Launcher sync: add bounded retry or next-change reconciliation for logged model/config mismatches.
- Root/model ownership: extract normal publication/order and remote-attention source state from `main.qml` in later checkpoints.
- Context menu: migrate role normalization and action policy into tested helpers before simplifying the QML menu.
- Observability: add structured action results for activation, menu creation, and launcher mutations.
