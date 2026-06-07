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

## Completed Checkpoint 4: Activation And Menu Action Results

- Status: completed.
- What changed: added `TaskActionLogic.js` for activation and context-menu action results; routed shortcut activation, task activation, remote-attention activation, context-menu request validation, and menu creation failure through stable result codes and diagnostic logging decisions.
- Behavior that must remain unchanged: invalid shortcuts, stale task indexes, empty remote-attention targets, and failed menu creation still produce no user-visible UI action; valid normal and remote-attention activation still call the same `TasksModel.requestActivate`; context-menu visual-parent state and signal wiring stay unchanged.
- Verification: `node tests/taskactionlogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 5: Launcher Mutation Action Results

- Status: completed.
- What changed: extended `TaskActionLogic.js` to classify launcher pin/unpin request inputs and Plasma request outcomes; routed root `pinLauncher()` and `unpinLauncher()` through shared mutation results so rejected launcher mutations are distinguishable from empty-url no-ops and successful writes.
- Behavior that must remain unchanged: empty launcher URLs still do not change launcher state; successful pin/unpin still calls the same `TasksModel.requestAddLauncher` or `TasksModel.requestRemoveLauncher` method and then persists `tasksModel.launcherList`; false Plasma request results still do not persist or rewrite launcher configuration.
- Verification: `node tests/taskactionlogic.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 6: Normal Task Publication Store

- Status: completed.
- What changed: added `NormalTaskStoreLogic.js` for publication-key allocation, publish/remove transitions, manual-order pruning, and composed normal-task snapshots; routed root normal publication, removal, key allocation, and recompute functions through that helper while keeping hidden repeaters as event producers.
- Behavior that must remain unchanged: Plasma task rows are still observed by the existing hidden normal-task repeater; pinned prefix and unpinned manual ordering still use `TaskModelLogic.composeNormalTaskEntries(...)`; drag/drop behavior and visible normal task order remain unchanged.
- Verification: `node tests/normaltaskstorelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/NormalTaskStoreLogic.js`, `package/contents/ui/main.qml`, `tests/normaltaskstorelogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 7: Single Normal Task Store State

- Status: completed.
- What changed: extended the normal-task store to own the publication counter and routed root through one `normalTaskStoreState` property instead of separate normal entry-map, manual-order, entries, and publication-id properties.
- Behavior that must remain unchanged: normal publication keys remain `normal:1`, `normal:2`, and so on; visible normal task entries, pinned-prefix ordering, manual unpinned ordering, drag/drop movement, and hidden normal-task repeater publication behavior remain unchanged.
- Verification: `node tests/normaltaskstorelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `rg "normalTaskEntryMap|normalTaskManualOrder|nextNormalTaskPublicationId" package/contents/ui/main.qml`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/NormalTaskStoreLogic.js`, `package/contents/ui/main.qml`, `tests/normaltaskstorelogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 8: Single Remote-Attention State

- Status: completed.
- What changed: extended `RemoteAttentionLogic.js` with a remote-attention state wrapper for publish/remove/recompute transitions and routed root through one `remoteAttentionState` property instead of separate entry-map, order, count, entries, and target properties.
- Behavior that must remain unchanged: the existing `attentionTasksModel` and hidden attention repeater still observe Plasma rows; remote attention remains one far-right item; count, target selection, latest-qualified ordering, activation, `Meta+0`, and context-menu model routing remain unchanged.
- Verification: `node tests/remoteattentionlogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `rg "remoteAttentionEntryMap|remoteAttentionOrder|remoteAttentionCount|remoteAttentionEntries|remoteAttentionTarget" package/contents/ui/main.qml`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/RemoteAttentionLogic.js`, `package/contents/ui/main.qml`, `tests/remoteattentionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 9: Context-Menu Role Snapshot

- Status: completed.
- What changed: added tested helpers in `TaskContextMenuLogic.js` for live role reads and menu-facing snapshots, then routed `TaskContextMenu.qml` role helpers through them so the QML view no longer calls `taskModel.data(...)` directly.
- Behavior that must remain unchanged: live `TasksModel` roles still override snapshot task fallbacks; launcher URL precedence remains `LauncherUrlWithoutIcon` before `LauncherUrl`; menu order, labels, visibility, checked/enabled state, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `rg "taskModel\\.data|\\.data\\(" package/contents/ui/TaskContextMenu.qml`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 10: Context-Menu Launcher Activity State

- Status: completed.
- What changed: added tested menu-facing launcher activity state helpers in `TaskContextMenuLogic.js`, normalized raw launcher activity lists before checked-state predicates, and routed `TaskContextMenu.qml` launcher-activity predicates through those helpers.
- Behavior that must remain unchanged: launcher activity menu order, labels, visibility, pin/unpin effects, serialized launcher-list writes, and per-activity toggle results remain unchanged.
- Behavior corrected from the design review: a raw empty launcher activity list entering the menu represents all activities, matching the existing spec and launcher serialization semantics.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Planned Checkpoint 11: Context-Menu Task Request Results

- Status: planned.
- What will change: add tested action-result helpers for context-menu task requests, classify missing task models, stale model indexes, and missing request methods, and route `TaskContextMenu.qml` task request effects through one structured wrapper.
- Behavior that must remain unchanged: context-menu order, labels, visibility, enabled and checked state, invoked `TasksModel.request*` methods, model indexes, and request payloads remain unchanged.
- Verification: `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files likely changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Remaining Follow-Up Work

- Launcher sync: add bounded retry or next-change reconciliation for logged model/config mismatches.
- Root/model ownership: extract normal and remote hidden model repeaters into named source components in later checkpoints.
- Context menu: continue migrating action policy into tested helpers before simplifying the QML menu.
- Observability: extend structured action results beyond activation, menu creation, and launcher mutations to context-menu window/task requests.
