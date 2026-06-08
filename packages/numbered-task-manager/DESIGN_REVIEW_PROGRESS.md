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

## Completed Checkpoint 11: Context-Menu Task Request Results

- Status: completed.
- What changed: added tested action-result helpers for context-menu task requests, classified missing task models, stale model indexes, and missing request methods, and routed `TaskContextMenu.qml` task request effects through one structured wrapper.
- Behavior that must remain unchanged: context-menu order, labels, visibility, enabled and checked state, invoked `TasksModel.request*` methods, model indexes, and request payloads remain unchanged.
- Verification: `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 12: Context-Menu Task Activity State

- Status: completed.
- What changed: added tested task-activity menu state helpers in `TaskContextMenuLogic.js` and routed `TaskContextMenu.qml` task-activity checked-state predicates through those helpers.
- Behavior that must remain unchanged: activity submenu order, labels, visibility, all-activities checked behavior, per-activity checked behavior, and task activity toggle results remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskactivitylogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 13: Context-Menu Virtual Desktop State

- Status: completed.
- What changed: added tested virtual-desktop menu state helpers in `TaskContextMenuLogic.js` and routed `TaskContextMenu.qml` all-desktops and per-desktop checked-state predicates through those helpers.
- Behavior that must remain unchanged: virtual-desktop submenu order, labels, visibility, all-desktops checked behavior, per-desktop checked behavior, and `requestVirtualDesktops` payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskentrylogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 14: Context-Menu Basic Action State

- Status: completed.
- What changed: added tested helpers for New Instance, Move, and Resize menu visible/enabled state in `TaskContextMenuLogic.js` and routed those `TaskContextMenu.qml` bindings through helper output.
- Behavior that must remain unchanged: context-menu order, labels, visibility, enabled state, click effects, request method names, and request payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `rg "visible: root\\.boolRole\\(root\\.atm\\.(CanLaunchNewInstance|IsMovable|IsResizable)|enabled: root\\.hasWindowTask && root\\.boolRole\\(root\\.atm\\.(IsMovable|IsResizable)" package/contents/ui/TaskContextMenu.qml`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 15: Context-Menu Checkable Window Action State

- Status: completed.
- What changed: added tested helpers for Minimize and Maximize checked/visible/enabled state in `TaskContextMenuLogic.js` and routed those `TaskContextMenu.qml` bindings through helper output.
- Behavior that must remain unchanged: context-menu order, labels, checked state, visibility, enabled state, click effects, request method names, and request payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs`; `rg "checked: root\\.boolRole\\(root\\.atm\\.(IsMinimized|IsMaximized)|enabled: root\\.hasWindowTask && root\\.boolRole\\(root\\.atm\\.(IsMinimizable|IsMaximizable)|visible: root\\.isWindow\\(\\) && root\\.boolRole\\(root\\.atm\\.(IsMinimizable|IsMaximizable)" package/contents/ui/TaskContextMenu.qml`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 16: Remaining Checkable Window Action State

- Status: completed.
- What changed: added tested helpers for checkable window actions without capability roles and routed Keep Above, Keep Below, Full Screen, Shade, No Border, and Exclude From Capture checked/visible/enabled state through `TaskContextMenuLogic.js`.
- Behavior that must remain unchanged: context-menu order, labels, checked state, visibility, enabled state, click effects, request method names, and request payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `checkableWindowActionState` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg "checked: root\\.boolRole\\(root\\.atm\\.(IsKeepAbove|IsKeepBelow|IsFullScreen|IsShaded|HasNoBorder|IsExcludedFromCapture)|enabled: root\\.hasWindowTask && root\\.boolRole\\(root\\.atm\\.(IsFullScreenable|IsShadeable|CanSetNoBorder)|visible: root\\.isWindow\\(\\) && root\\.boolRole\\(root\\.atm\\.(IsFullScreenable|IsShadeable|CanSetNoBorder)" package/contents/ui/TaskContextMenu.qml`; `node tests/taskactionlogic.test.mjs`; `node tests/taskactivitylogic.test.mjs`; `node tests/taskentrylogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 17: Remaining Menu Action Availability

- Status: completed.
- What changed: added tested helpers for task-action section visibility, Virtual Desktops visibility/enabled state, New Desktop enabled state, Activities visibility/enabled state, and Close visibility/enabled state; routed the corresponding `TaskContextMenu.qml` bindings through `TaskContextMenuLogic.js`.
- Behavior that must remain unchanged: context-menu order, labels, submenu composition, checked state, click effects, request method names, and request payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `closeActionState` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; source guards for direct root task availability predicates and obsolete inline virtual-desktop/activity/close predicates; `node tests/taskactionlogic.test.mjs`; `node tests/taskactivitylogic.test.mjs`; `node tests/taskentrylogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 18: Normal Task Source Component

- Status: completed.
- What changed: declared `NormalTaskSource.qml` as the normal `TasksModel` row observation boundary, added a source-structure guard, and moved the hidden normal publication repeater out of `main.qml` into the new source component.
- Behavior that must remain unchanged: `main.qml` still owns the normal `TasksModel`, launcher writes, store state, drag/drop, context-menu wiring, and visible rendering; normal task qualification, publication keys, launcher pin-state derivation, model indexes, pinned prefix composition, unpinned manual order, and context-menu task data remain unchanged.
- Verification: `node tests/normaltasksourceqml.test.mjs` failed before implementation because `NormalTaskSource.qml` did not exist; after implementation, `node tests/normaltasksourceqml.test.mjs`; `node tests/normaltaskstorelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/normaltasksourceqml.test.mjs`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 19: Remote Attention Source Component

- Status: completed.
- What changed: declared `RemoteAttentionSource.qml` as the attention `TasksModel` row observation boundary, added a source-structure guard, and moved the hidden remote-attention publication repeater out of `main.qml` into the new source component.
- Behavior that must remain unchanged: `main.qml` still owns the attention `TasksModel`, remote-attention state, activation, context-menu model routing, and visible rendering; remote-attention qualification, keys, count, target selection, latest-qualified ordering, far-right placement, and `Meta+0` behavior remain unchanged.
- Verification: `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because `RemoteAttentionSource.qml` did not exist; after implementation, `node tests/remoteattentionsourceqml.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/remoteattentionsourceqml.test.mjs`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 20: Launcher Sync Reconciliation

- Status: completed.
- What changed: declared launcher reconciliation ownership, added tested pending reconciliation helpers in `LauncherListLogic.js`, and routed `main.qml` launcher-list changes through one bounded next-change retry before ordinary persistence.
- Behavior that must remain unchanged: successful launcher-list writes still clear without retry; unchanged launcher lists still no-op; assignment failures still reset `updatingLauncherConfig`; pin/unpin, context-menu launcher-activity writes, and pinned-launcher drag writes still apply the same requested launcher list.
- Verification: `node tests/launcherlistlogic.test.mjs` failed before implementation because reconciliation helpers did not exist; after implementation, `node tests/launcherlistlogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/LauncherListLogic.js`, `package/contents/ui/main.qml`, `tests/launcherlistlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 21: Context-Menu Task Command Descriptors

- Status: completed.
- What changed: declared typed context-menu task command ownership, added `TaskActionLogic.contextMenuTaskCommand(...)`, extended context-menu task request validation to carry command arguments, and routed `TaskContextMenu.qml` task request click handlers through command descriptors.
- Behavior that must remain unchanged: context-menu order, labels, visible/enabled/checked state, invoked `TasksModel.request*` methods, model indexes, and virtual-desktop/activity request payloads remain unchanged.
- Verification: `node tests/taskactionlogic.test.mjs` failed before implementation because `contextMenuTaskCommand` did not exist; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 22: Context-Menu Launcher Command Descriptors

- Status: completed.
- What changed: declared typed context-menu launcher command ownership, added `TaskActionLogic.contextMenuLauncherCommand(...)`, replaced the menu's pin/unpin/launcher-list signals with one launcher-command signal, and routed root through a dispatcher that calls the existing pin, unpin, and launcher-list replacement effects.
- Behavior that must remain unchanged: Pin/Unpin menu state, labels, and visibility remain unchanged; successful pin/unpin still call the same root mutation paths; launcher activity updates still emit the same replacement launcher list into `applyLauncherList()`.
- Verification: `node tests/taskactionlogic.test.mjs` failed before implementation because `contextMenuLauncherCommand` did not exist; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 23: Context-Menu Task Execution Diagnostics

- Status: completed.
- What changed: declared context-menu task execution diagnostics, added `TaskActionLogic.contextMenuTaskExecutionResult(...)`, and wrapped `TaskContextMenu.qml` task command execution in a structured success/error result path.
- Behavior that must remain unchanged: successful context-menu task commands still call the same `TasksModel.request*` method with the same model index and optional payload; failed validation still returns before execution; user-visible menu behavior remains unchanged.
- Verification: `node tests/taskactionlogic.test.mjs` failed before implementation because `contextMenuTaskExecutionResult` did not exist; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 24: Launcher Command Dispatch Diagnostics

- Status: completed.
- What changed: declared root launcher command dispatch diagnostics, added `TaskActionLogic.contextMenuLauncherCommandDispatchResult(...)`, and routed `main.qml` launcher command dispatch through structured results before executing root side effects.
- Behavior that must remain unchanged: valid `pinLauncher`, `unpinLauncher`, and `replaceLauncherList` descriptors still call the same root methods with the same launcher URL or launcher-list payload; malformed or unknown launcher commands now log a structured diagnostic instead of being silently ignored.
- Verification: `node tests/taskactionlogic.test.mjs` failed before implementation because `contextMenuLauncherCommandDispatchResult` did not exist; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 25: Shared Task Entry Projection Helpers

- Status: completed.
- What changed: declared launcher URL precedence and fallback icon ownership in `TaskEntryLogic.js`; added shared launcher URL and icon fallback helpers; replaced duplicated launcher URL precedence and normal/remote fallback icon literals in task sources, menu snapshot logic, task-like delegates, and root bindings.
- Behavior that must remain unchanged: `LauncherUrlWithoutIcon` still takes precedence over `LauncherUrl`; normal task fallback icons remain `application-x-executable`; remote attention fallback icons remain `dialog-warning`; task entry fields and visible icon behavior remain unchanged.
- Verification: `node tests/taskentrylogic.test.mjs` failed before implementation because projection helpers did not exist; `node tests/taskcontextmenulogic.test.mjs` failed before implementation because duplicate source literals remained; after implementation, `node tests/taskentrylogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just test-host`; `just lint-js-host`; `just lint-qml`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskEntryLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/TaskModelLogic.js`, `package/contents/ui/RemoteAttentionLogic.js`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, `package/contents/ui/main.qml`, `tests/taskentrylogic.test.mjs`, `tests/taskmodellogic.test.mjs`, `tests/remoteattentionlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 26: Normal Task Projection Dependencies

- Status: completed.
- What changed: declared that normal-task projection should import shared task-entry mechanics directly; changed `TaskModelLogic.js` to include `TaskEntryLogic.js`; removed the broad `taskEntryLogic` namespace argument from normal-task creation and qualification call sites.
- Behavior that must remain unchanged: normal task entry projection, qualification, launcher-backed composition, source indexes, manual ordering, and the existing `hasAnyLauncher` field remain unchanged.
- Verification: `node tests/taskmodellogic.test.mjs` failed before implementation because `createNormalTaskEntry` still accepted the injected helper namespace; after implementation, `node tests/taskmodellogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/normaltaskstorelogic.test.mjs`; `node tests/taskentrylogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskModelLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `tests/taskmodellogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 27: Remote Attention Projection Dependencies

- Status: completed.
- What changed: declared that remote-attention projection should import shared task-entry mechanics directly; changed `RemoteAttentionLogic.js` to include `TaskEntryLogic.js`; removed the broad `taskEntryLogic` namespace argument from remote-attention creation and qualification call sites.
- Behavior that must remain unchanged: remote-attention entry projection, qualification, fallback icon behavior, window-id copying, keying, ordering, count/target selection, and state transitions remain unchanged.
- Verification: `node tests/remoteattentionlogic.test.mjs` failed before implementation because `createRemoteAttentionEntry` still accepted the injected helper namespace; after implementation, `node tests/remoteattentionlogic.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskentrylogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/RemoteAttentionLogic.js`, `package/contents/ui/RemoteAttentionSource.qml`, `tests/remoteattentionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 28: Normal Task Entry Schema Cleanup

- Status: completed.
- What changed: declared that normal task entries should expose only production-consumed or documented fields; removed the unused `hasAnyLauncher` field from normal task projection; removed the unused raw `HasLauncher` handoff from `NormalTaskSource.qml`.
- Behavior that must remain unchanged: widget-owned `hasLauncher` still means launcher row or widget-pinned launcher membership; normal task entry projection, qualification, launcher-backed composition, source indexes, and manual ordering remain unchanged.
- Verification: `node tests/taskmodellogic.test.mjs` failed before implementation because `hasAnyLauncher` was still present on normal task entries; after implementation, `node tests/taskmodellogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `rg -n "hasAnyLauncher" package tests docs DESIGN_REVIEW_PROGRESS.md`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskModelLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `tests/taskmodellogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 29: Launcher Activity Menu State Bindings

- Status: completed.
- What changed: declared that launcher-activity menu items should consume checked-state helper output directly; removed the menu-local launcher activity checked-state wrapper functions; bound the All Activities and per-activity launcher menu items directly to `TaskContextMenuLogic.launcherActivityMenuState(...)`.
- Behavior that must remain unchanged: launcher activity lists still normalize through the shared all-activities semantics; All Activities and per-activity checked states, labels, ordering, visibility, and click handlers remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the launcher activity wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "launcherPinnedToAllActivities|launcherPinnedToActivity|function launcherActivityMenuState|TaskContextMenuLogic\\.launcherActivityMenuState" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 30: Task Activity Menu State Bindings

- Status: completed.
- What changed: declared that task-activity menu items should consume checked-state helper output directly; removed the menu-local task activity checked-state wrapper functions; bound the All Activities and per-activity task menu items directly to `TaskContextMenuLogic.taskActivityMenuState(...)`.
- Behavior that must remain unchanged: task activity all/current checked states, submenu labels, ordering, visibility, and `requestActivities` command payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the task activity wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "taskOnAllActivities|taskOnActivity|function taskActivityMenuState|TaskContextMenuLogic\\.taskActivityMenuState" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 31: Virtual Desktop Menu State Bindings

- Status: completed.
- What changed: declared that virtual desktop menu items should consume checked-state helper output directly; removed the menu-local virtual desktop checked-state wrapper function; bound the All Desktops and per-desktop menu items directly to `TaskContextMenuLogic.virtualDesktopMenuState(...)`.
- Behavior that must remain unchanged: All Desktops and per-desktop checked states still use live role data with task fallback; submenu labels, ordering, visibility, and `requestVirtualDesktops` command payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the virtual desktop wrapper function still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function virtualDesktopMenuState|root\\.virtualDesktopMenuState|TaskContextMenuLogic\\.virtualDesktopMenuState" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 32: Basic Action State Bindings

- Status: completed.
- What changed: declared that New Instance, Move, Resize, and their section separator should consume action-state helper output directly; removed the menu-local basic action-state wrapper functions; bound those menu items directly to `TaskContextMenuLogic.newInstanceActionState(...)`, `TaskContextMenuLogic.windowCapabilityActionState(...)`, and `TaskContextMenuLogic.menuActionSectionVisible(...)`.
- Behavior that must remain unchanged: menu order, labels, visible/enabled states, and `requestNewInstance`, `requestMove`, and `requestResize` command dispatch remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the basic action wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function newInstanceActionState|function windowCapabilityActionState|function menuActionSectionVisible|root\\.(newInstanceActionState|windowCapabilityActionState|menuActionSectionVisible)|TaskContextMenuLogic\\.(newInstanceActionState|windowCapabilityActionState|menuActionSectionVisible)" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 33: Checkable Window Action State Bindings

- Status: completed.
- What changed: declared that checkable window action menu items should consume helper output directly; removed the menu-local checkable window action-state wrapper functions; bound Minimize, Maximize, Keep Above, Keep Below, Fullscreen, Shade, No Border, and Hide from Screencasts directly to `TaskContextMenuLogic.checkableWindowCapabilityActionState(...)` or `TaskContextMenuLogic.checkableWindowActionState(...)`.
- Behavior that must remain unchanged: checked, visible, and enabled states, menu labels, ordering, and all existing toggle command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the checkable window action wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function checkableWindowCapabilityActionState|function checkableWindowActionState|root\\.(checkableWindowCapabilityActionState|checkableWindowActionState)|checked: root\\.boolRole|TaskContextMenuLogic\\.(checkableWindowCapabilityActionState|checkableWindowActionState)" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 34: Terminal Action State Bindings

- Status: completed.
- What changed: declared that terminal context-menu actions should consume helper output directly; removed the menu-local terminal action-state wrapper functions; bound Virtual Desktops, New Desktop, Activities, and Close directly to `TaskContextMenuLogic.virtualDesktopsActionState(...)`, `TaskContextMenuLogic.newVirtualDesktopActionState(...)`, `TaskContextMenuLogic.taskActivitiesActionState(...)`, and `TaskContextMenuLogic.closeActionState(...)`.
- Behavior that must remain unchanged: submenu composition, labels, visible/enabled states, ordering, and virtual-desktop/activity/close command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the terminal action wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function (virtualDesktopsActionState|newVirtualDesktopActionState|taskActivitiesActionState|closeActionState)|root\\.(virtualDesktopsActionState|newVirtualDesktopActionState|taskActivitiesActionState|closeActionState)|TaskContextMenuLogic\\.(virtualDesktopsActionState|newVirtualDesktopActionState|taskActivitiesActionState|closeActionState)" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 35: Boolean Role Snapshot Bindings

- Status: completed.
- What changed: declared that boolean role snapshot fields should be consumed directly from `TaskContextMenuLogic.taskRoleSnapshot(...)`; removed the menu-local `isWindow()` and `isLauncher()` passthrough functions; replaced their call sites with direct `roleSnapshot().isWindow` and `roleSnapshot().isLauncher` reads.
- Behavior that must remain unchanged: live role data and task fallbacks still flow through `TaskContextMenuLogic.taskRoleSnapshot(...)`; menu visible/enabled states and command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the boolean role snapshot wrapper functions still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function isWindow|function isLauncher|\\bisWindow\\(\\)|\\bisLauncher\\(\\)|roleSnapshot\\(\\)\\.(isWindow|isLauncher)" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 36: Launcher URL Snapshot Binding

- Status: completed.
- What changed: declared that scalar role snapshot fields such as `launcherUrl` should be consumed directly from `TaskContextMenuLogic.taskRoleSnapshot(...)`; removed the menu-local `launcherUrl()` passthrough function; replaced its call sites with direct `roleSnapshot().launcherUrl` reads.
- Behavior that must remain unchanged: launcher URL live role data and task fallback still flow through `TaskContextMenuLogic.taskRoleSnapshot(...)`; pin/unpin state, launcher activity refresh, launcher position lookup, launcher activity mutation guards, and launcher command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the launcher URL snapshot wrapper function still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function launcherUrl|launcherUrl\\(\\)|roleSnapshot\\(\\)\\.launcherUrl" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 37: Activity Snapshot Binding

- Status: completed.
- What changed: declared that list role snapshot fields such as `activities` should be consumed directly from `TaskContextMenuLogic.taskRoleSnapshot(...)`; removed the menu-local `activities()` passthrough function; replaced task activity toggle and checked-state call sites with direct `roleSnapshot().activities` reads.
- Behavior that must remain unchanged: task activity live role data and task fallback still flow through `TaskContextMenuLogic.taskRoleSnapshot(...)`; activity toggle payloads, All Activities checked state, per-activity checked state, labels, ordering, and command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the activity snapshot wrapper function still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function activities|activities\\(\\)|roleSnapshot\\(\\)\\.activities" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 38: Virtual Desktop Snapshot Binding

- Status: completed.
- What changed: declared that list role snapshot fields such as `virtualDesktops` should be consumed directly from `TaskContextMenuLogic.taskRoleSnapshot(...)`; removed the menu-local `virtualDesktops()` passthrough function; replaced virtual desktop checked-state call sites with direct `roleSnapshot().virtualDesktops` reads.
- Behavior that must remain unchanged: virtual desktop live role data and task fallback still flow through `TaskContextMenuLogic.taskRoleSnapshot(...)`; All Desktops checked state, per-desktop checked state, labels, ordering, virtual desktop mutation payloads, and command descriptors remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the virtual desktop snapshot wrapper function still existed; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function virtualDesktops|virtualDesktops\\(\\)|roleSnapshot\\(\\)\\.virtualDesktops" package/contents/ui/TaskContextMenu.qml tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskContextMenu.qml`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 39: Remote Attention Visible-Item Activation

- Status: completed.
- What changed: declared that rendered task-like activation should consume composed visible item descriptors where practical; added `VisibleTaskItemsLogic.visibleRemoteAttentionItem(...)`; routed `AttentionItem` activation through the composed remote-attention visible item instead of reading `remoteAttentionState.target` directly at the activation decision.
- Behavior that must remain unchanged: clicking the remote-attention item still activates the same target model index; `Meta+0` shortcut activation, normal task activation, attention rendering, and context-menu wiring remain unchanged.
- Verification: `node tests/visibletaskitemslogic.test.mjs` failed before implementation because `visibleRemoteAttentionItem` did not exist; after implementation, `node tests/visibletaskitemslogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `rg -n "visibleRemoteAttentionItem|taskActivationRequest\\(\\\"activateRemoteAttention\\\"|remoteAttentionState\\.target" package/contents/ui/main.qml package/contents/ui/VisibleTaskItemsLogic.js tests/visibletaskitemslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/VisibleTaskItemsLogic.js`, `package/contents/ui/main.qml`, `tests/visibletaskitemslogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 40: Remote Attention Visible-Item Rendering

- Status: completed.
- What changed: declared that rendered remote-attention metadata should come from the composed visible item descriptor; added a root `remoteAttentionVisibleItem` binding; changed `AttentionItem` count, icon, model index, task data, title, visibility, and activation lookup to consume that descriptor instead of separately reconstructing target fields from `remoteAttentionState`.
- Behavior that must remain unchanged: remote-attention visibility, count, icon fallback, title, context-menu payload, activation target, and `Meta+0` shortcut behavior remain unchanged.
- Verification: `node tests/taskvisuallogic.test.mjs` failed before implementation because `main.qml` did not expose `remoteAttentionVisibleItem`; after implementation, `node tests/taskvisuallogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `rg -n "remoteAttentionVisibleItem|remoteAttentionState\\.target|visibleItem\\.entry|count: visibleItem|taskData: entry|title: entry" package/contents/ui/main.qml tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/main.qml`, `tests/taskvisuallogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 41: Remote Attention Source-Owned State

- Status: completed.
- What changed: declared that `RemoteAttentionSource.qml` should own one remote-attention state snapshot; moved `remoteAttentionState` from root into `RemoteAttentionSource.qml`; exposed source-owned `count` and `target`; removed root publication/removal callback functions and callback bindings from the source instantiation.
- Behavior that must remain unchanged: remote-attention qualification, keying, ordering, latest-target selection, count/target snapshot, `Meta+0` shortcut behavior, rendered attention item, context-menu payload, and activation target remain unchanged.
- Verification: `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because the source did not own `attentionState`; after implementation, `node tests/remoteattentionsourceqml.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `rg -n "RemoteAttentionLogic|remoteAttentionState|publishAttention|removeAttention|publishRemoteAttention\\(|removeRemoteAttention\\(|remoteAttentionSource\\.(count|target)|property var attentionState|readonly property int count|readonly property var target" package/contents/ui/main.qml package/contents/ui/RemoteAttentionSource.qml tests/remoteattentionsourceqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, `tests/remoteattentionsourceqml.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 42: Remote Attention Source-Owned Model

- Status: completed.
- What changed: declared that `RemoteAttentionSource.qml` should own the attention `TasksModel` and narrow activation adapter; moved the remote-attention `TasksModel` from root into `RemoteAttentionSource.qml`; exposed the source-owned task model for context-menu routing; routed remote-attention activation through `remoteAttentionSource.requestActivate(...)`.
- Behavior that must remain unchanged: attention model activity/desktop filter settings, qualification, publication state, latest-target selection, rendered attention item, context-menu task model routing, click activation, and `Meta+0` shortcut activation remain unchanged.
- Verification: `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because root still owned `attentionTasksModel`; after implementation, `node tests/remoteattentionsourceqml.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `rg -n "attentionTasksModel|remoteAttentionSource\\.requestActivate|remoteAttentionSource\\.taskModel|TaskManager\\.TasksModel|currentActivity:" package/contents/ui/main.qml package/contents/ui/RemoteAttentionSource.qml tests/remoteattentionsourceqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, `tests/remoteattentionsourceqml.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 43: Task Scope Model Filter Policy

- Status: completed.
- What changed: declared `TaskScopeLogic.js` as the owner for task-model scope filter settings; added tested normal-task and remote-attention model filter settings; bound the normal `TasksModel` and remote-attention source model filters through those helpers instead of raw booleans in QML.
- Behavior that must remain unchanged: normal tasks still filter upstream by activity and virtual desktop while including all screens; remote attention still observes all activities, screens, and virtual desktops upstream and applies local qualification for current activity and remote virtual desktop.
- Verification: `node tests/taskscopelogic.test.mjs` failed before implementation because `TaskScopeLogic.js` did not exist; after implementation, `node tests/taskscopelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `rg -n "TaskScopeLogic|filterByActivity|filterByScreen|filterByVirtualDesktop|normalTaskModelFilterSettings|remoteAttentionModelFilterSettings" package/contents/ui/main.qml package/contents/ui/RemoteAttentionSource.qml package/contents/ui/TaskScopeLogic.js tests/taskscopelogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskScopeLogic.js`, `package/contents/ui/main.qml`, `package/contents/ui/RemoteAttentionSource.qml`, `tests/taskscopelogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 44: Task Scope Local Qualification Policy

- Status: completed.
- What changed: declared local scope qualifiers as part of `TaskScopeLogic.js`; added tested normal-task and remote-attention qualification helpers; routed `NormalTaskSource.qml` and `RemoteAttentionSource.qml` through those helpers; kept the previous `TaskModelLogic.qualifiesNormalTask(...)` and `RemoteAttentionLogic.qualifiesRemoteAttention(...)` exports as compatibility wrappers.
- Behavior that must remain unchanged: normal-task qualification still rejects tasks outside the current activity, accepts launchers and startup entries after the activity check, and requires windows to be on the current virtual desktop; remote attention still requires a window demanding attention in the current activity on a remote virtual desktop.
- Verification: `node tests/taskscopelogic.test.mjs` failed before implementation because `TaskScopeLogic.js` did not expose local qualifier helpers; after implementation, `node tests/taskscopelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `rg -n "normalTaskQualifies|remoteAttentionQualifies|qualifiesNormalTask|qualifiesRemoteAttention|TaskScopeLogic" package/contents/ui tests/taskscopelogic.test.mjs tests/taskmodellogic.test.mjs tests/remoteattentionlogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskScopeLogic.js`, `package/contents/ui/TaskModelLogic.js`, `package/contents/ui/RemoteAttentionLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, `tests/taskscopelogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 45: Scope Qualifier Facade Removal

- Status: completed.
- What changed: declared that task-specific modules should not re-export scope qualification helpers; removed the compatibility qualifier wrappers and `TaskScopeLogic.js` includes from `TaskModelLogic.js` and `RemoteAttentionLogic.js`; migrated their tests so qualification behavior is covered only by `TaskScopeLogic.js`.
- Behavior that must remain unchanged: normal and remote-attention source components still call the same `TaskScopeLogic` qualifier helpers introduced in checkpoint 44; normal task entry creation, normal task composition, remote-attention entry creation, keying, publication, and state transitions remain unchanged.
- Verification: `node tests/taskscopelogic.test.mjs` failed before implementation because `TaskModelLogic.js` still included `TaskScopeLogic.js` and exposed `qualifiesNormalTask(...)`; after implementation, `node tests/taskscopelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/remoteattentionlogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `rg -n "qualifiesNormalTask|qualifiesRemoteAttention|normalTaskQualifies|remoteAttentionQualifies|Qt\\.include\\(\\\"TaskScopeLogic\\.js\\\"\\)" package/contents/ui tests`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskModelLogic.js`, `package/contents/ui/RemoteAttentionLogic.js`, `tests/taskscopelogic.test.mjs`, `tests/taskmodellogic.test.mjs`, `tests/remoteattentionlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 46: Task Activity Facade Removal

- Status: completed.
- What changed: declared `TaskActivityLogic.js` as the owner for task activity mutation decisions only; removed generic activity primitive pass-through exports from `TaskActivityLogic.js`; changed `main.qml` to import `ActivityScopeLogic.js` directly for current-activity membership; kept context-menu task activity toggles on `TaskActivityLogic.taskActivitiesAfterToggle(...)`.
- Behavior that must remain unchanged: current-activity membership still uses the same null-activity and all-activities semantics; task activity toggles still convert all-activities inputs to the toggled activity and still add/remove concrete activity IDs as before; context-menu task activity command payloads are unchanged.
- Verification: `node tests/taskactivitylogic.test.mjs` failed before implementation because `TaskActivityLogic.js` still exposed `allActivitiesId(...)`; after implementation, `node tests/taskactivitylogic.test.mjs`; `node tests/activityscopelogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `rg -n "TaskActivityLogic|ActivityScopeLogic|function (allActivitiesId|stringListContains|uniqueStringList|activitiesAreAll|normalizedActivityList|isInCurrentActivity)\\b" package/contents/ui/TaskActivityLogic.js package/contents/ui/main.qml package/contents/ui/TaskContextMenu.qml tests/taskactivitylogic.test.mjs tests/activityscopelogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActivityLogic.js`, `package/contents/ui/main.qml`, `tests/taskactivitylogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 47: Launcher Activity Facade Removal

- Status: completed.
- What changed: declared launcher logic as the owner for launcher-specific activity serialization and visibility helpers only; removed generic activity primitive wrapper functions from `LauncherListLogic.js`; changed launcher-specific helpers to call `ActivityScopeLogic.js` directly for normalization, all-activities checks, containment, and current-activity membership.
- Behavior that must remain unchanged: launcher activity parsing, serialization, all-activities serialization to a bare launcher URL, launcher visibility by current activity, activity toggle results, activity updates at positions, visible launcher position, and widget pin membership remain unchanged.
- Verification: `node tests/launcherlistlogic.test.mjs` failed before implementation because `LauncherListLogic.js` still exposed `stringListContains(...)`; after implementation, `node tests/launcherlistlogic.test.mjs`; `node tests/activityscopelogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `rg -n "function (stringListContains|uniqueStringList|activitiesAreAll|normalizedActivityList|isInCurrentActivity)\\b|ActivityScopeLogic\\.(stringListContains|uniqueStringList|activitiesAreAll|normalizedActivityList|isInCurrentActivity)" package/contents/ui/LauncherListLogic.js tests/launcherlistlogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/LauncherListLogic.js`, `tests/launcherlistlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 48: Named Task Metrics

- Status: completed.
- What changed: declared task visual constants as part of `TaskMetricsLogic.js`; added named helpers for task extent, title threshold, slot width cap, readable slot width, and normal/attention natural-width minima; changed root layout, `TaskItem.qml`, and `AttentionItem.qml` to bind those values through the metrics owner instead of local numeric copies.
- Behavior that must remain unchanged: task and attention delegates remain 40px tall by default; titles still become visible at the 96px threshold; normal task natural width still bottoms out at 96 only when titles are shown; attention natural width still bottoms out at 112; horizontal slot width is still capped at 220.
- Verification: `node tests/taskmetricslogic.test.mjs` failed before implementation because `TaskMetricsLogic.js` did not expose named metric helpers; after implementation, `node tests/taskmetricslogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `rg -n "readonly property int taskExtent:\\s*40|readonly property int titleVisibilityThreshold:\\s*96|property int titleVisibilityThreshold:\\s*96|root\\.showTitle \\? 96 : 0|TaskMetricsLogic\\.taskSlotWidth\\(width, visibleItemCount, minimumReadableSlotWidth, 220\\)|Math\\.min\\(220|implicitHeight:\\s*40|TaskMetricsLogic\\.(taskExtent|titleVisibilityThreshold|maximumSlotWidth|normalNaturalWidthMinimum|attentionNaturalWidthMinimum|minimumReadableSlotWidth)" package/contents/ui/main.qml package/contents/ui/TaskItem.qml package/contents/ui/AttentionItem.qml package/contents/ui/TaskMetricsLogic.js tests/taskmetricslogic.test.mjs tests/taskitempresentationlogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskMetricsLogic.js`, `package/contents/ui/main.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, `tests/taskmetricslogic.test.mjs`, `tests/taskitempresentationlogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 49: Launcher Activity Update Reasons

- Status: completed.
- What changed: declared launcher activity mutation results as typed results with stable reason codes; changed `LauncherListLogic.launcherActivityUpdate(...)` to return `ok` and `reason` while preserving `activities`, `changed`, and `launchers`; changed the context menu to treat `ok: false` as the invalid-position no-op.
- Behavior that must remain unchanged: valid launcher activity updates still update `launcherActivityList`, unchanged activity updates still avoid emitting a replacement launcher-list command, invalid launcher positions still no-op, and successful changed updates still emit the same replacement launcher-list command payload.
- Verification: `node tests/launcherlistlogic.test.mjs` failed before implementation because activity update results lacked `ok` and `reason`; after implementation, `node tests/launcherlistlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `rg -n "launcherActivityUpdate|reason: \\\"(invalid-position|unchanged|updated)\\\"|ok: (true|false)|if \\(!update\\.ok\\)|if \\(!update\\)" package/contents/ui/LauncherListLogic.js package/contents/ui/TaskContextMenu.qml tests/launcherlistlogic.test.mjs tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/LauncherListLogic.js`, `package/contents/ui/TaskContextMenu.qml`, `tests/launcherlistlogic.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 50: Task Move Reason Codes

- Status: completed.
- What changed: declared normal-task move decisions as reason-coded results; added `TaskModelLogic.canMoveTaskResult(...)` and `TaskModelLogic.moveManualTaskOrderResult(...)`; kept the existing `canMoveTask(...)` boolean and `moveManualTaskOrder(...)` `{ moved, order }` wrapper surfaces for QML compatibility.
- Behavior that must remain unchanged: pinned launcher moves, unpinned manual moves, pinned/unpinned boundary rejections, stale-index rejections, and same-index no-ops keep the same boolean outcome; manual order updates still produce the same order arrays.
- Verification: `node tests/taskmodellogic.test.mjs` failed before implementation because `canMoveTaskResult(...)` did not exist; after implementation, `node tests/taskmodellogic.test.mjs`; `node tests/normaltaskstorelogic.test.mjs`; `rg -n "canMoveTaskResult|moveManualTaskOrderResult|reason: \\\"(invalid-index|same-index|missing-source|missing-target|boundary-crossing|pinned-launcher-denied|movable-pinned|movable-unpinned|same-position|moved)\\\"|function canMoveTask\\(|function moveManualTaskOrder\\(" package/contents/ui/TaskModelLogic.js tests/taskmodellogic.test.mjs package/contents/ui/main.qml`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskModelLogic.js`, `tests/taskmodellogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 51: Drag Move Result Boundary

- Status: completed.
- What changed: declared root drag/drop glue as the consumer of typed move results; changed `main.qml` so root exposes `canMoveTaskResult(...)`, `moveTask(...)` gates on that typed result, and `canMoveTask(...)` plus delegate `canDropTask` remain boolean projections.
- Behavior that must remain unchanged: drag acceptance and rejection outcomes, manual task moves, pinned launcher moves, invalid and stale-index no-ops, and delegate drop enablement remain unchanged.
- Verification: `node tests/taskvisuallogic.test.mjs` failed before implementation because `main.qml` did not expose `canMoveTaskResult(...)`; after implementation, `node tests/taskvisuallogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `rg -n "canMoveTaskResult|function canMoveTask\\(|TaskModelLogic\\.canMoveTask\\(|TaskModelLogic\\.canMoveTaskResult|canDropTask:" package/contents/ui/main.qml tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/main.qml`, `tests/taskvisuallogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 52: Drag Rejection Diagnostics

- Status: completed.
- What changed: declared drag rejection logging as an action/effect-boundary responsibility; added `TaskActionLogic.dragMoveRejectionResult(...)`; changed root drag handling to log rejected typed move decisions through the existing action diagnostic path.
- Behavior that must remain unchanged: accepted drags still move exactly as before; expected same-index, pinned/unpinned boundary, and pinned-launcher policy rejections remain quiet no-ops; stale or invalid drag/drop indexes now produce internal diagnostics.
- Verification: `node tests/taskactionlogic.test.mjs` failed before implementation because `dragMoveRejectionResult(...)` did not exist; `node tests/taskvisuallogic.test.mjs` failed because root did not log the rejection result; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `rg -n "dragMoveRejectionResult|moveDecision\\.reason|missing-source|pinned-launcher-denied|boundary-crossing|logActionResult\\(rejection\\)" package/contents/ui/main.qml package/contents/ui/TaskActionLogic.js tests/taskactionlogic.test.mjs tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/main.qml`, `tests/taskactionlogic.test.mjs`, `tests/taskvisuallogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 53: Task Drag Interaction Helper

- Status: completed.
- What changed: declared task drag/drop event policy as helper-owned; added `TaskInteractionLogic.js` for drag MIME payloads, drop source parsing, and drop acceptance projection; changed `TaskItem.qml` to keep Qt event handling while calling the helper for policy.
- Behavior that must remain unchanged: task drags still advertise the same widget MIME type with the same source index payload; accepted drops still call `taskDropped(sourceIndex, targetIndex, drop)`; self-drops, missing drop callbacks, malformed payloads, and root-denied drops remain ignored.
- Verification: `node tests/taskinteractionlogic.test.mjs` failed before implementation because `TaskInteractionLogic.js` did not exist; `node tests/taskvisuallogic.test.mjs` failed because `TaskItem.qml` still owned local drag/drop helper functions; after implementation, `node tests/taskinteractionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `rg -n "TaskInteractionLogic|function sourceIndexFromDrop|function acceptsDrop|taskDragMimeData|taskDropSourceIndex|canAcceptTaskDrop|QtQuick\\.Drag\\.mimeData|onEntered|onDropped" package/contents/ui/TaskItem.qml package/contents/ui/TaskInteractionLogic.js tests/taskinteractionlogic.test.mjs tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskInteractionLogic.js`, `package/contents/ui/TaskItem.qml`, `tests/taskinteractionlogic.test.mjs`, `tests/taskvisuallogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 54: Task Context Menu Request Helper

- Status: completed.
- What changed: declared task-like context-menu request payloads as helper-owned; added `TaskInteractionLogic.taskContextMenuRequest(...)`; changed normal and attention delegates to keep their current zero-delay focus/timer mechanics while emitting the shared request shape from the helper.
- Behavior that must remain unchanged: menu-key and right-click interactions still use the existing zero-delay timer, delegates still force active focus before requesting the menu, and emitted requests still contain the same `modelIndex`, `task`, and `visualParent` fields.
- Verification: `node tests/taskinteractionlogic.test.mjs` failed before implementation because `taskContextMenuRequest(...)` did not exist; `node tests/taskvisuallogic.test.mjs` failed because delegates still constructed request objects inline; after implementation, `node tests/taskinteractionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `rg -n "taskContextMenuRequest|contextMenuRequested\\(\\{|modelIndex: root\\.modelIndex|task: root\\.taskData|visualParent: root" package/contents/ui/TaskItem.qml package/contents/ui/AttentionItem.qml package/contents/ui/TaskInteractionLogic.js tests/taskinteractionlogic.test.mjs tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `package/contents/ui/TaskInteractionLogic.js`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, `tests/taskinteractionlogic.test.mjs`, `tests/taskvisuallogic.test.mjs`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 55: Shared Task-Like Interaction Triggers

- Status: completed.
- What changed: declared shared task-like trigger ownership; added `TaskLikeInteraction.qml` for hover state, menu-key/right-click zero-delay context-menu requests, focus handoff, and left-click activation; routed `TaskItem.qml` and `AttentionItem.qml` through the shared component while keeping normal drag/drop code in `TaskItem.qml`.
- Behavior that must remain unchanged: visual highlight still comes from pointer hover, delegate active focus, and context-menu-open state; menu-key and right-click interactions still use the zero-delay timer and force focus on the delegate before emitting the existing `{ modelIndex, task, visualParent }` request; left-click normal tasks still emit activation with the task index; left-click remote attention still emits the attention activation signal; normal task drag/drop remains unchanged.
- Verification: `node tests/taskvisuallogic.test.mjs` failed before implementation because delegates did not consume `TaskLikeInteraction.qml`; after implementation, `node tests/taskvisuallogic.test.mjs`; `node tests/taskinteractionlogic.test.mjs`; `just lint-qml`; `just lint-js-host`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeInteraction.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 56: Context-Menu Platform Entry Snapshots

- Status: completed.
- What changed: declared context-menu platform entry construction as helper-owned; added `TaskContextMenuLogic.activityEntriesSnapshot(...)` and `TaskContextMenuLogic.virtualDesktopEntriesSnapshot(...)`; routed `TaskContextMenu.qml` activity and virtual-desktop entry construction through those helpers while keeping Plasma `ActivityInfo` and `VirtualDesktopInfo` ownership in the menu.
- Behavior that must remain unchanged: activity entries keep running-activity order, stringified IDs, activity icons, and name fallback to the activity ID; virtual-desktop entries keep desktop ID order and `Desktop N` fallback labels; menu refresh triggers, submenu ordering, labels, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the snapshot helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 57: Context-Menu Basic Action Role Snapshot

- Status: completed.
- What changed: declared basic action live-role reads as helper-owned; added `TaskContextMenuLogic.basicActionRoleSnapshot(...)`; routed New Instance, Move, and Resize through one snapshot instead of item-local `boolRole(...)` calls.
- Behavior that must remain unchanged: New Instance, Move, and Resize labels, ordering, visible/enabled states, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `basicActionRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 58: Context-Menu Minimize/Maximize Role Snapshot

- Status: completed.
- What changed: declared checkable window action live-role reads as snapshot-owned; added `TaskContextMenuLogic.minimizeMaximizeRoleSnapshot(...)`; routed Minimize and Maximize checked/capability state through that snapshot instead of item-local `boolRole(...)` calls.
- Behavior that must remain unchanged: Minimize and Maximize labels, ordering, checked state, visible/enabled states, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `minimizeMaximizeRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 59: Context-Menu Keep Above/Below Role Snapshot

- Status: completed.
- What changed: added `TaskContextMenuLogic.keepAboveBelowRoleSnapshot(...)`; routed Keep Above and Keep Below checked state through that snapshot instead of item-local `boolRole(...)` calls.
- Behavior that must remain unchanged: Keep Above and Keep Below labels, ordering, checked state, visible/enabled states, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `keepAboveBelowRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 60: Context-Menu Fullscreen/Shade/No Border Role Snapshot

- Status: completed.
- What changed: added `TaskContextMenuLogic.fullscreenShadeBorderRoleSnapshot(...)`; routed Fullscreen, Shade, and No Border checked/capability state through that snapshot instead of item-local `boolRole(...)` calls.
- Behavior that must remain unchanged: Fullscreen, Shade, and No Border labels, ordering, checked state, visible/enabled states, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `fullscreenShadeBorderRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 61: Context-Menu Virtual Desktop Role Snapshot

- Status: completed.
- What changed: added `TaskContextMenuLogic.virtualDesktopRoleSnapshot(...)`; routed virtual-desktop submenu availability and all-desktops checked state through that snapshot instead of section-local `boolRole(...)` calls.
- Behavior that must remain unchanged: Virtual Desktops and New Desktop labels, submenu ordering, desktop checked state, visible/enabled states, command descriptors, request method names, model indexes, and click payloads remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `virtualDesktopRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 62: Context-Menu Capture/Close Role Snapshot

- Status: completed.
- What changed: added `TaskContextMenuLogic.captureCloseRoleSnapshot(...)`; routed Hide from Screencasts checked state and Close visibility through that snapshot instead of item-local `boolRole(...)` calls; removed the now-unused QML `roleData(...)` and `boolRole(...)` pass-through wrappers.
- Behavior that must remain unchanged: Hide from Screencasts and Close labels, ordering, checked state, visible/enabled states, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `captureCloseRoleSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 63: Context-Menu Task Role Snapshot Property

- Status: completed.
- What changed: made `TaskContextMenu.qml` expose a single `taskRoles` snapshot property from `TaskContextMenuLogic.taskRoleSnapshot(...)`; routed launcher URL, window-state, virtual-desktop membership, and task-activity membership consumers through that property; removed the QML `roleSnapshot()` pass-through function.
- Behavior that must remain unchanged: menu labels, ordering, Pin/Unpin and launcher-activity URL selection, window action visibility, virtual desktop checked state, task activity checked state, command descriptors, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the `taskRoles` property did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 64: Context-Menu Task Activity Toggle Command

- Status: completed.
- What changed: added `TaskContextMenuLogic.taskActivityToggleCommand(...)`; routed task activity toggle clicks through that helper so `TaskContextMenu.qml` no longer imports or calls `TaskActivityLogic.js` directly.
- Behavior that must remain unchanged: Activities submenu labels, ordering, all-activities command payload, individual activity checked state, toggle payloads, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `taskActivityToggleCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskactivitylogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 65: Context-Menu Virtual Desktop Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.allVirtualDesktopsCommand(...)`, `TaskContextMenuLogic.virtualDesktopCommand(...)`, and `TaskContextMenuLogic.newVirtualDesktopCommand(...)`; routed the Virtual Desktops submenu click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: Virtual Desktops submenu labels, ordering, all-desktops `[]` payload, per-desktop `[id]` payload, New Desktop command, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the virtual desktop command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 66: Context-Menu Basic Action Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.newInstanceCommand(...)`, `TaskContextMenuLogic.moveCommand(...)`, and `TaskContextMenuLogic.resizeCommand(...)`; routed the New Instance, Move, and Resize click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: New Instance, Move, and Resize labels, ordering, visible/enabled states, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the basic action command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 67: Context-Menu Minimize/Maximize Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.minimizeCommand(...)` and `TaskContextMenuLogic.maximizeCommand(...)`; routed the Minimize and Maximize click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: Minimize and Maximize labels, ordering, checked state, visible/enabled states, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the minimize/maximize command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 68: Context-Menu Keep Above/Below Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.keepAboveCommand(...)` and `TaskContextMenuLogic.keepBelowCommand(...)`; routed the Keep Above Others and Keep Below Others click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: Keep Above Others and Keep Below Others labels, ordering, checked state, visible/enabled states, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the keep-above/below command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 69: Context-Menu Fullscreen/Shade/No Border Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.fullscreenCommand(...)`, `TaskContextMenuLogic.shadeCommand(...)`, and `TaskContextMenuLogic.noBorderCommand(...)`; routed the Fullscreen, Shade, and No Border click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: Fullscreen, Shade, and No Border labels, ordering, checked state, capability-based visible/enabled states, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the fullscreen/shade/no-border command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 70: Context-Menu Capture/Close Commands

- Status: completed.
- What changed: added `TaskContextMenuLogic.excludeFromCaptureCommand(...)` and `TaskContextMenuLogic.closeCommand(...)`; routed Hide from Screencasts and Close click handlers through those helpers instead of constructing task commands inline in QML.
- Behavior that must remain unchanged: Hide from Screencasts and Close labels, ordering, Hide from Screencasts checked state, Close visible/enabled state, request method names, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the capture/close command helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 71: Context-Menu All Task Activities Command

- Status: completed.
- What changed: added `TaskContextMenuLogic.allTaskActivitiesCommand(...)`; routed the Activities submenu's All Activities click handler through that helper instead of constructing the `requestActivities` task command inline in QML.
- Behavior that must remain unchanged: Activities submenu labels, ordering, all-activities checked state, `requestActivities` method name, empty activity-list payload, model index handling, and click effect remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the all-task-activities command helper did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 72: Context-Menu Pin Launcher Command

- Status: completed.
- What changed: added `TaskContextMenuLogic.pinLauncherCommand(...)`; routed the Pin/Unpin click handler through that helper instead of selecting `pinLauncher` versus `unpinLauncher` inline in QML.
- Behavior that must remain unchanged: Pin/Unpin text, enabled state, pin versus unpin choice, launcher URL payload, emitted `launcherCommandRequested` signal, and launcher command shape remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `pinLauncherCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 73: Context-Menu Launcher List Command

- Status: completed.
- What changed: added `TaskContextMenuLogic.replaceLauncherListCommand(...)`; routed launcher-activity replace-list dispatch through that helper instead of constructing `replaceLauncherList` commands inline in QML.
- Behavior that must remain unchanged: launcher activity update validation, local `launcherActivityList` refresh, unchanged-list no-op behavior, emitted `launcherCommandRequested` signal, `replaceLauncherList` action name, and normalized launcher-list payload remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `replaceLauncherListCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 74: Context-Menu Launcher Activity Update Command

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherActivityUpdateCommand(...)`; routed launcher activity update validation and replace-list command creation through that helper instead of calling `LauncherListLogic.launcherActivityUpdate(...)` directly in QML; made `ActivityScopeLogic.js` re-entrant for shared helper includes.
- Behavior that must remain unchanged: invalid launcher positions still return `false`, local `launcherActivityList` still refreshes from effective serialized activities, unchanged updates still do not emit commands, changed updates still emit the same `replaceLauncherList` command payload, and menu refresh behavior remains unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherActivityUpdateCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/ActivityScopeLogic.js`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 75: Context-Menu Launcher All-Activities Update

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherAllActivitiesUpdateCommand(...)`; routed the Launcher Activities submenu's All Activities click path through that helper instead of computing `launcherActivitiesAfterAllToggle(...)` inline in QML.
- Behavior that must remain unchanged: missing launcher model/URL guards remain in QML, all-activities checked with a current activity narrows to that activity, scoped launchers switch to all activities, all-activities checked with no current activity remains a no-op, changed updates emit the same replace-list command, unchanged/invalid/no-op updates do not emit, and launcher activities still refresh afterward.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherAllActivitiesUpdateCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 76: Context-Menu Launcher Activity Toggle Update

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherActivityToggleUpdateCommand(...)`; routed per-activity launcher toggles through that helper instead of computing `launcherActivitiesAfterToggle(...)` inline in QML.
- Behavior that must remain unchanged: missing launcher model/URL guards remain in QML, all-activities launchers narrow to the clicked activity, scoped launchers append newly checked activities, toggling off the only current activity remains unchanged through the existing fallback, empty activity IDs remain unchanged, changed updates emit the same replace-list command, unchanged updates do not emit, and launcher activities still refresh afterward.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherActivityToggleUpdateCommand(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 77: Context-Menu Launcher Pin State Snapshot

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherPinStateSnapshot(...)`; routed `TaskContextMenu.qml` launcher pin state through that helper so the menu no longer imports `LauncherListLogic.js` directly.
- Behavior that must remain unchanged: Pin/Unpin text, enabled state, command choice, launcher URL payloads, launcher activity visibility, current-activity scoping, launcher-position lookup, and pinned-position reporting remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherPinStateSnapshot(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 78: Context-Menu Launcher Activities Action State

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherActivitiesActionState(...)`; routed the Launcher Activities menu item's enabled and visible bindings through that helper instead of splitting the descriptor between QML and `launcherActivitiesVisible(...)`.
- Behavior that must remain unchanged: Launcher Activities remains enabled when a task model exists and the launcher can be pinned, remains visible only for pinned launcher URLs when more than one activity exists, keeps the same submenu label/order, and keeps the same click handlers and launcher activity update payloads.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherActivitiesActionState(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 79: Context-Menu Pin Launcher Action Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.pinLauncherAction(...)`; routed the Pin/Unpin menu item's text, enabled state, and launcher command through that single descriptor instead of computing action state and command separately in QML.
- Behavior that must remain unchanged: Pin/Unpin text, enabled state, pin versus unpin command choice, launcher URL payload, emitted launcher command signal, and menu ordering remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `pinLauncherAction(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 80: Context-Menu Basic Action Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.newInstanceAction(...)`, `TaskContextMenuLogic.basicMoveAction(...)`, and `TaskContextMenuLogic.basicResizeAction(...)`; routed the New Instance, Move, and Resize menu items through descriptors that carry labels, enabled/visible state, and task-model command descriptors.
- Behavior that must remain unchanged: New Instance, Move, and Resize labels, ordering, visible/enabled states, request methods, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the basic action descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 81: Context-Menu Minimize/Maximize Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.minimizeAction(...)` and `TaskContextMenuLogic.maximizeAction(...)`; routed the Minimize and Maximize menu items through descriptors that carry labels, check state, enabled/visible state, and task-model command descriptors.
- Behavior that must remain unchanged: Minimize and Maximize labels, ordering, checkability, checked state, visible/enabled states, request methods, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Minimize/Maximize descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 82: Context-Menu Keep Above/Below Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.keepAboveAction(...)` and `TaskContextMenuLogic.keepBelowAction(...)`; routed the Keep Above Others and Keep Below Others menu items through descriptors that carry labels, check state, enabled/visible state, and task-model command descriptors.
- Behavior that must remain unchanged: Keep Above Others and Keep Below Others labels, ordering, checkability, checked state, visible/enabled states, request methods, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Keep Above/Below descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 83: Context-Menu Fullscreen/Shade/No Border Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.fullscreenAction(...)`, `TaskContextMenuLogic.shadeAction(...)`, and `TaskContextMenuLogic.noBorderAction(...)`; routed the Fullscreen, Shade, and No Border menu items through descriptors that carry labels, check state, enabled/visible state, and task-model command descriptors.
- Behavior that must remain unchanged: Fullscreen, Shade, and No Border labels, ordering, checkability, checked state, capability-based visible/enabled states, request methods, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Fullscreen/Shade/No Border descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 84: Context-Menu Capture/Close Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.excludeFromCaptureAction(...)` and `TaskContextMenuLogic.closeAction(...)`; routed the Hide from Screencasts and Close menu items through descriptors that carry labels, enabled/visible state, and task-model command descriptors, with Hide from Screencasts also carrying check state.
- Behavior that must remain unchanged: Hide from Screencasts and Close labels, ordering, Hide from Screencasts checkability and checked state, Close non-checkable behavior, visible/enabled states, request methods, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Capture/Close descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 85: Context-Menu Virtual Desktop Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.virtualDesktopsAction(...)`, `TaskContextMenuLogic.allVirtualDesktopsAction(...)`, `TaskContextMenuLogic.virtualDesktopAction(...)`, and `TaskContextMenuLogic.newVirtualDesktopAction(...)`; routed the Virtual Desktops submenu item, All Desktops entry, per-desktop entries, and New Desktop entry through descriptors that carry labels, check state where applicable, enabled/visible state where applicable, and task-model command descriptors.
- Behavior that must remain unchanged: Virtual Desktops submenu order, labels, checkability and checked state, visibility/enabled state, `requestVirtualDesktops` and `requestNewVirtualDesktop` methods, payloads, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Virtual Desktop descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 86: Context-Menu Activity Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.taskActivitiesAction(...)`, `TaskContextMenuLogic.allTaskActivitiesAction(...)`, and `TaskContextMenuLogic.taskActivityAction(...)`; routed the Activities submenu item, All Activities entry, and per-activity entries through descriptors that carry labels, check state where applicable, enabled/visible state where applicable, and task-model command descriptors.
- Behavior that must remain unchanged: Activities submenu order, labels, checkability and checked state, visibility/enabled state, `requestActivities` method, all-activities empty-list payload, per-activity toggle payloads, model indexes, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Activity descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 87: Context-Menu Launcher Activity Descriptors

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherActivitiesAction(...)`, `TaskContextMenuLogic.launcherAllActivitiesAction(...)`, and `TaskContextMenuLogic.launcherActivityAction(...)`; routed the Launcher Activities submenu item, All Activities entry, and per-activity entries through descriptors that carry labels, check state where applicable, enabled/visible state where applicable, and launcher update-command results.
- Behavior that must remain unchanged: Launcher Activities submenu order, labels, checkability and checked state, visibility/enabled state, launcher all-activities and per-activity toggle update payloads, local launcher-activity refresh behavior, emitted launcher command shape, and no-op behavior remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the Launcher Activity descriptor helpers did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 88: Context-Menu Action Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.menuActionSection(...)`; routed the basic/window action separator through that descriptor instead of binding the view directly to `menuActionSectionVisible(...)`.
- Behavior that must remain unchanged: the separator still appears when Launcher Activities, New Instance, or any window-task action group can appear; menu ordering, all action labels, enabled/visible state, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `menuActionSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 89: Context-Menu Close Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.closeActionSection(...)`; exposed one root-level Close action descriptor and routed the close separator through the section descriptor instead of binding it to `closeItem.visible`.
- Behavior that must remain unchanged: the close separator still appears exactly when the Close action is visible; Close remains in the same menu position with the same label, enabled/visible state, task-model command, model index, and click effect.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `closeActionSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 90: Context-Menu Basic Action Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.basicActionsSection(...)`; routed the basic action separator plus New Instance, Move, and Resize menu items through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: the separator still appears when Launcher Activities, New Instance, or any window-task action group can appear; New Instance, Move, and Resize keep the same menu order, labels, visibility/enabled state, task-model commands, model index handling, and click effects.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `basicActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 91: Context-Menu Minimize/Maximize Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.minimizeMaximizeActionsSection(...)`; routed Minimize and Maximize menu items through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Minimize and Maximize keep the same menu order, labels, checkability, checked state, visibility/enabled state, task-model commands, model index handling, and click effects.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `minimizeMaximizeActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 92: Context-Menu Keep Above/Below Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.keepAboveBelowActionsSection(...)`; routed Keep Above Others and Keep Below Others menu items through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Keep Above Others and Keep Below Others keep the same menu order, labels, checkability, checked state, visibility/enabled state, task-model commands, model index handling, and click effects.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `keepAboveBelowActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 93: Context-Menu Fullscreen/Shade/No Border Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.fullscreenShadeBorderActionsSection(...)`; routed Fullscreen, Shade, and No Border menu items through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Fullscreen, Shade, and No Border keep the same menu order, labels, checkability, checked state, capability-based visibility/enabled state, task-model commands, model index handling, and click effects.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `fullscreenShadeBorderActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 94: Context-Menu Capture Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.captureActionsSection(...)`; routed Hide from Screencasts through one section descriptor instead of an item-local helper call in QML.
- Behavior that must remain unchanged: Hide from Screencasts keeps the same menu order, label, checkability, checked state, visibility/enabled state, task-model command, model index handling, and click effect.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `captureActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 95: Context-Menu Pin Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.pinActionsSection(...)`; routed Pin/Unpin through one section descriptor instead of an item-local helper call in QML.
- Behavior that must remain unchanged: Pin/Unpin keeps the same menu order, labels, enabled state, launcher command shape, launcher URL handling, and click signal.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `pinActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 96: Context-Menu Virtual Desktop Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.virtualDesktopActionsSection(...)`; routed the Virtual Desktops submenu item, All Desktops entry, per-desktop entry factory, and New Desktop entry through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Virtual Desktops submenu order, labels, checkability and checked state, visibility/enabled state, `requestVirtualDesktops` and `requestNewVirtualDesktop` command payloads, model index handling, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `virtualDesktopActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 97: Context-Menu Task Activity Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.taskActivityActionsSection(...)`; routed the Activities submenu item, All Activities entry, and per-activity entry factory through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Activities submenu order, labels, checkability and checked state, visibility/enabled state, `requestActivities` command payloads, model index handling, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `taskActivityActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 98: Context-Menu Launcher Activity Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.launcherActivityActionsSection(...)`; routed the Launcher Activities submenu item, All Activities entry, and per-activity entry factory through one section descriptor instead of item-local helper calls in QML.
- Behavior that must remain unchanged: Launcher Activities submenu order, labels, checkability and checked state, visibility/enabled state, launcher update result shape, local launcher-activity refresh behavior, emitted launcher command shape, and no-op behavior remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `launcherActivityActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 99: Context-Menu Close Actions Section Descriptor

- Status: completed.
- What changed: added `TaskContextMenuLogic.closeActionsSection(...)`; routed the Close separator and Close item through one section descriptor instead of separate root-level helper calls in QML.
- Behavior that must remain unchanged: Close menu order, label, visibility/enabled state, separator visibility, `requestClose` command payload, model index handling, and click effect remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `closeActionsSection(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 100: Visible Normal Item Render Model

- Status: completed.
- What changed: added `VisibleTaskItemsLogic.normalVisibleTaskItems(...)`; routed the normal task `ListView` through composed normal visible-item descriptors instead of raw normal task entries plus per-delegate visible-item lookup.
- Behavior that must remain unchanged: normal task render order, slot numbers, drag/drop source and target indexes, task activation, context-menu request payloads, remote-attention placement, and visible item sizing count remain unchanged.
- Verification: `node tests/visibletaskitemslogic.test.mjs` failed before implementation because `normalVisibleTaskItems(...)` did not exist and `node tests/taskvisuallogic.test.mjs` failed because `main.qml` still rendered from `normalTaskEntries`; after implementation, `node tests/visibletaskitemslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/visibletaskitemslogic.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/VisibleTaskItemsLogic.js`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 101: Visible Normal Lookup Removal

- Status: completed.
- What changed: removed the obsolete `VisibleTaskItemsLogic.visibleItemForNormalIndex(...)` helper after normal rendering moved to `normalVisibleTaskItems(...)`, and kept a source guard that prevents reintroducing per-delegate visible-item reconstruction.
- Behavior that must remain unchanged: composed visible item order, normal render order, slot numbers, shortcut activation, drag/drop source and target indexes, remote-attention placement, and visible item sizing count remain unchanged.
- Verification: `node tests/visibletaskitemslogic.test.mjs` failed before implementation because `visibleItemForNormalIndex(...)` still existed; after implementation, `node tests/visibletaskitemslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/visibletaskitemslogic.test.mjs`, `package/contents/ui/VisibleTaskItemsLogic.js`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 102: Context-Menu Action Sections Model

- Status: completed.
- What changed: added `TaskContextMenuLogic.contextMenuActionSections(...)` as a broader action-section snapshot and routed `TaskContextMenu.qml` through that single action model instead of directly assembling each section descriptor in QML.
- Behavior that must remain unchanged: menu order, labels, visibility, enabled state, checked state, task-model command payloads, launcher command payloads, launcher activity update results, model index handling, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `contextMenuActionSections(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 103: Context-Menu Platform State Adapter

- Status: completed.
- What changed: added `TaskContextMenuPlatformState.qml` to own the menu's `ActivityInfo` and `VirtualDesktopInfo` platform objects, activity entry snapshots, desktop entry snapshots, and current activity binding; routed `TaskContextMenu.qml` through that adapter.
- Behavior that must remain unchanged: activity submenu entries, virtual desktop submenu entries, current-activity use for launcher pin/activity decisions, launcher activity refresh timing, menu open behavior, and Plasma menu content structure remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the menu did not use `TaskContextMenuPlatformState`; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/TaskContextMenuPlatformState.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 104: Context-Menu Role Snapshots Model

- Status: completed.
- What changed: added `TaskContextMenuLogic.contextMenuRoleSnapshots(...)` to compose all menu-facing live role snapshots in one tested helper and routed `TaskContextMenu.qml` through that aggregate instead of calling each role snapshot helper directly.
- Behavior that must remain unchanged: live role reads, fallback task values, launcher URL precedence, Pin/Unpin state, all menu visible/enabled/checked states, task-model command payloads, launcher command payloads, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `contextMenuRoleSnapshots(...)` did not exist; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 105: Context-Menu Role State Adapter

- Status: completed.
- What changed: added `TaskContextMenuRoleState.qml` to own `AbstractTasksModel` role IDs, valid-model-index state, role source snapshots, and menu role snapshots; routed `TaskContextMenu.qml` through that adapter.
- Behavior that must remain unchanged: model-index validity handling, live role reads, fallback task values, launcher URL precedence, Pin/Unpin state, all menu visible/enabled/checked states, task-model command payloads, launcher command payloads, click effects, and Plasma menu content structure remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the menu did not use `TaskContextMenuRoleState`; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/TaskContextMenuRoleState.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 106: Context-Menu Task Command Adapter

- Status: completed.
- What changed: added `TaskContextMenuTaskCommandAdapter.qml` to own context-menu task request validation, direct `TasksModel` request execution, and execution-result emission; routed `TaskContextMenu.qml` click handlers through that adapter.
- Behavior that must remain unchanged: context-menu order, labels, visible/enabled/checked state, helper-owned command descriptors, request method names, model index handling, optional request payloads, exception classification, diagnostic filtering, and user-visible menu behavior remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the menu did not use `TaskContextMenuTaskCommandAdapter`; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/TaskContextMenuTaskCommandAdapter.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 107: Context-Menu Launcher Activity Adapter

- Status: completed.
- What changed: added `TaskContextMenuLauncherActivityAdapter.qml` to own launcher-activity list refresh, normalized activity-list snapshots, launcher activity update application, and replacement launcher-command emission; routed `TaskContextMenu.qml` show and launcher-activity click handlers through that adapter.
- Behavior that must remain unchanged: launcher activity menu ordering, labels, checked state, visibility/enabled state, all-activities and per-activity update descriptors, invalid-update no-op behavior, unchanged-update no-op behavior, refresh-after-click behavior, emitted replacement launcher command shape, and Pin/Unpin command behavior remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the menu did not use `TaskContextMenuLauncherActivityAdapter`; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/TaskContextMenuLauncherActivityAdapter.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 108: Context-Menu Launcher State Adapter

- Status: completed.
- What changed: added `TaskContextMenuLauncherState.qml` to own the menu-facing launcher list snapshot, current launcher position, and pin-state snapshot; routed `TaskContextMenu.qml` action-section inputs through that adapter.
- Behavior that must remain unchanged: Pin/Unpin state, launcher activity visibility, launcher position lookup, launcher-list inputs to action sections, launcher command payloads, menu ordering, labels, visibility/enabled state, and click effects remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because the menu did not use `TaskContextMenuLauncherState`; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/TaskContextMenuLauncherState.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 109: Remote Attention Source Snapshot

- Status: completed.
- What changed: added a source-owned remote-attention `snapshot` to `RemoteAttentionSource.qml` and routed `main.qml` visible-item composition through that snapshot instead of rebuilding `{ count, target }` at the root.
- Behavior that must remain unchanged: remote-attention qualification, count, target selection, far-right placement, `Meta+0` targeting, activation, context-menu payloads, visible-item composition, and rendered metadata remain unchanged.
- Verification: `node tests/remoteattentionsourceqml.test.mjs` and `node tests/taskvisuallogic.test.mjs` failed before implementation because the source did not expose `snapshot` and root still rebuilt the snapshot inline; after implementation, `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/remoteattentionsourceqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 110: Launcher Sync Adapter

- Status: completed.
- What changed: added `LauncherSyncAdapter.qml` to own launcher model/config write transactions, reconciliation state, the update guard, convergence diagnostics, and bounded retry handling; routed root launcher persistence, replacement writes, pinned-launcher drag writes, and `TasksModel.onLauncherListChanged` through that adapter.
- Behavior that must remain unchanged: unchanged launcher lists still no-op; pin/unpin still call Plasma add/remove requests before persisting `tasksModel.launcherList`; context-menu launcher activity replacements and pinned-launcher drag writes still apply the same requested launcher list; assignment failures still reset the update guard; write mismatches still log diagnostics and use the same bounded reconciliation path.
- Verification: `node tests/launchersyncadapterqml.test.mjs` failed before implementation because `LauncherSyncAdapter.qml` did not exist and root still owned sync state/functions; after implementation, `node tests/launchersyncadapterqml.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/launchersyncadapterqml.test.mjs`, `package/contents/ui/LauncherSyncAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 111: Activation Effect Adapter

- Status: completed.
- What changed: added `TaskActivationAdapter.qml` to own the post-validation activation effect dispatch and routed root shortcut, normal-task, and remote-attention activation requests through that adapter.
- Behavior that must remain unchanged: `TaskActionLogic` still owns activation request validation and diagnostics; shortcut target selection, normal task activation, remote-attention activation, model indexes, and source-model routing remain unchanged.
- Verification: `node tests/taskactivationadapterqml.test.mjs` failed before implementation because `TaskActivationAdapter.qml` did not exist and root still owned `requestActivation()`; after implementation, `node tests/taskactivationadapterqml.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskactivationadapterqml.test.mjs`, `package/contents/ui/TaskActivationAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 112: Context-Menu Lifecycle Adapter

- Status: completed.
- What changed: added `TaskContextMenuAdapter.qml` to own context-menu request validation, menu object creation, visual-parent open/close state, and menu signal wiring; routed root task and remote-attention context-menu requests through that adapter, and made `TaskContextMenu.qml` emit structured task-action results instead of logging them directly.
- Behavior that must remain unchanged: context-menu request validation, creation-result classification, diagnostic message format, menu placement, visual-parent open state, task-model inputs, launcher-model inputs, menu contents, launcher command dispatch, and task command effects remain unchanged.
- Verification: `node tests/taskcontextmenuadapterqml.test.mjs` failed before implementation because `TaskContextMenuAdapter.qml` did not exist and root still owned menu creation; after implementation, `node tests/taskcontextmenuadapterqml.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskcontextmenuadapterqml.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuAdapter.qml`, `package/contents/ui/TaskContextMenu.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 113: Launcher Command Adapter

- Status: completed.
- What changed: added `LauncherCommandAdapter.qml` to own context-menu launcher command dispatch, pin/unpin launcher mutation validation, Plasma launcher add/remove requests, mutation diagnostics, and persistence after successful mutations; routed `TaskContextMenuAdapter` launcher commands through that adapter.
- Behavior that must remain unchanged: valid Pin, Unpin, and launcher-list replacement commands still invoke the same Plasma requests or launcher-sync replacement path; empty launcher URLs and false Plasma request results still produce the same structured diagnostics and skip persistence; successful pin/unpin still persists `taskModel.launcherList`; dispatch still returns the command-dispatch result.
- Verification: `node tests/launchercommandadapterqml.test.mjs` failed before implementation because `LauncherCommandAdapter.qml` did not exist and root still owned launcher command functions; after implementation, `node tests/launchercommandadapterqml.test.mjs`; `node tests/taskcontextmenuadapterqml.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `node tests/launchersyncadapterqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/launchercommandadapterqml.test.mjs`, `tests/taskcontextmenuadapterqml.test.mjs`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/LauncherCommandAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 114: Normal Task Store Adapter

- Status: completed.
- What changed: added `NormalTaskStoreAdapter.qml` to own normal task store state, publication-key allocation, publish/remove transitions, recompute, and manual unpinned move updates; routed `NormalTaskSource` publication events and manual drag-order updates through that adapter.
- Behavior that must remain unchanged: normal publication keys still increment as `normal:N`; qualified and unqualified publication, stale removal, pinned-prefix composition, manual unpinned ordering, launcher-backed drag behavior, and visible normal task entries remain unchanged.
- Verification: `node tests/normaltaskstoreadapterqml.test.mjs` failed before implementation because `NormalTaskStoreAdapter.qml` did not exist and root still owned normal store state/functions; after implementation, `node tests/normaltaskstoreadapterqml.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/normaltaskstorelogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/normaltaskstoreadapterqml.test.mjs`, `package/contents/ui/NormalTaskStoreAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 115: Task Move Adapter

- Status: completed.
- What changed: added `TaskMoveAdapter.qml` to own drag/drop move decisions, drag rejection diagnostics, normal manual moves, pinned-launcher moves, and task source-index lookup; routed delegate drop checks and drop execution through that adapter.
- Behavior that must remain unchanged: typed move rejection reasons and diagnostic filtering remain unchanged; accepted manual unpinned moves still update `NormalTaskStoreAdapter`; accepted pinned launcher moves still use `LauncherSyncAdapter.applyLauncherList(...)`; rejected drops still do not accept the proposed drop action.
- Verification: `node tests/taskmoveadapterqml.test.mjs` failed before implementation because `TaskMoveAdapter.qml` did not exist and root still owned move functions; after implementation, `node tests/taskmoveadapterqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmodellogic.test.mjs`; `node tests/launcherlistlogic.test.mjs`; `node tests/normaltaskstoreadapterqml.test.mjs`; `node tests/normaltaskstorelogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskmoveadapterqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskMoveAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 116: Activation Request Adapter

- Status: completed.
- What changed: extended `TaskActivationAdapter.qml` to own shortcut, normal-task, and remote-attention activation request validation, structured failure emission, and successful activation dispatch; routed normal and attention delegate activations through the adapter while keeping root's `activateTaskAtIndex(index)` as the external Plasma action forwarding hook.
- Behavior that must remain unchanged: shortcut target selection, `Meta+0` targeting, normal task activation, remote-attention activation, invalid activation diagnostics, diagnostic filtering, source-model routing, and `TasksModel.requestActivate(...)` effects remain unchanged.
- Verification: `node tests/taskactivationadapterqml.test.mjs` failed before implementation because the adapter did not own activation request validation and root still owned normal/remote activation request construction; after implementation, `node tests/taskactivationadapterqml.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskactivationadapterqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskActivationAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 117: Remote Attention Item Surface

- Status: completed.
- What changed: extended `RemoteAttentionSource.qml` to consume the composed visible-item list, expose the rendered remote-attention item surface, and emit source-owned activation and context-menu requests; routed `AttentionItem` bindings through that surface and removed root's `remoteAttentionVisibleItem` binding.
- Behavior that must remain unchanged: remote-attention visibility, count badge, icon fallback, title, model index, task data, far-right placement, `Meta+0` targeting, activation request validation, and context-menu task-model routing remain unchanged.
- Verification: `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because the source did not expose the item surface and root still owned `remoteAttentionVisibleItem`; after implementation, `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskactivationadapterqml.test.mjs`; `node tests/visibletaskitemslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/remoteattentionsourceqml.test.mjs`, `tests/taskactivationadapterqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 118: Remote Attention Rendered Binding

- Status: completed.
- What changed: added `RemoteAttentionItem.qml` as the single rendered remote-attention binding that wraps `AttentionItem`, owns the source-backed item properties, and forwards activation/context-menu intents to `RemoteAttentionSource`; reduced root's attention rendering to one source-backed component instantiation.
- Behavior that must remain unchanged: remote-attention layout participation, implicit sizing, slot width, title visibility threshold, visibility, count badge, icon/title/model-index/task-data bindings, activation, context-menu request payloads, and far-right placement remain unchanged.
- Verification: `node tests/remoteattentionitemqml.test.mjs` failed before implementation because `RemoteAttentionItem.qml` did not exist and root still bound `AttentionItem` directly; after implementation, `node tests/remoteattentionitemqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/remoteattentionitemqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/RemoteAttentionItem.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 119: Context-Menu Task Model Default

- Status: completed.
- What changed: extended `TaskContextMenuAdapter.qml` to own the default normal task model for context-menu requests and normalize requests before validation; routed normal task delegate context-menu requests through the adapter without root-side `Object.assign(...)` task-model injection.
- Behavior that must remain unchanged: normal task context-menu creation, remote-attention context-menu task-model routing, missing-task-model diagnostics for requests without a default, visual-parent open state, menu contents, launcher command dispatch, and action-result logging remain unchanged.
- Verification: `node tests/taskcontextmenuadapterqml.test.mjs` failed before implementation because root still injected `tasksModel` into normal context-menu requests and the adapter had no default task model; after implementation, `node tests/taskcontextmenuadapterqml.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/taskcontextmenuadapterqml.test.mjs`, `package/contents/ui/TaskContextMenuAdapter.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 120: Normal Task Rendered Binding

- Status: completed.
- What changed: added `NormalTaskItem.qml` as the single rendered normal-task binding that wraps `TaskItem`, owns composed visible-item field mapping, and forwards activation, context-menu, and drag/drop effects to the existing adapters; reduced root's normal `ListView` delegate to one descriptor-backed component instantiation.
- Behavior that must remain unchanged: normal task layout dimensions, slot numbering, title/icon fallback, launcher-muted state, active/minimized/attention frame state, drag MIME type, drop acceptance, drop execution, activation, context-menu request routing, and manual/pinned move behavior remain unchanged.
- Verification: `node tests/normaltaskitemqml.test.mjs` failed before implementation because `NormalTaskItem.qml` did not exist and root still bound `TaskItem` directly; after implementation, `node tests/normaltaskitemqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskactivationadapterqml.test.mjs`; `node tests/taskcontextmenuadapterqml.test.mjs`; `node tests/taskmoveadapterqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `tests/normaltaskitemqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `tests/taskactivationadapterqml.test.mjs`, `tests/taskmoveadapterqml.test.mjs`, `tests/taskitempresentationlogic.test.mjs`, `package/contents/ui/NormalTaskItem.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 121: Platform State Adapter

- Status: completed.
- What changed: documented and added `TaskPlatformState.qml` as the applet-wide activity/desktop platform state adapter; moved `ActivityInfo`, `VirtualDesktopInfo`, current activity/current desktop exposure, launcher revision updates, current-activity membership checks, and visible launcher position lookup out of root.
- Behavior that must remain unchanged: normal model activity and virtual-desktop bindings, normal and remote source current activity/current desktop inputs, activity membership qualification, launcher revision increments on activity and launcher-list changes, visible launcher position lookup, launcher-list reconciliation, and launcher persistence remain unchanged.
- Verification: `node tests/taskplatformstateqml.test.mjs` failed before implementation because `TaskPlatformState.qml` did not exist and root still owned platform-state functions; after implementation, `node tests/taskplatformstateqml.test.mjs`; `node tests/taskscopelogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/launchersyncadapterqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskplatformstateqml.test.mjs`, `package/contents/ui/TaskPlatformState.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 122: Task List Representation Boundary

- Status: completed.
- What changed: documented and added `TaskListRepresentation.qml` as the owner of the `fullRepresentation` layout, task-list viewport, normal rendered item instantiation, and remote-attention item placement; reduced root's full representation binding to adapter/source/composed-item wiring.
- Behavior that must remain unchanged: fill-area layout participation, implicit size formulas, task extent, title threshold, minimum readable slot width, slot width cap, normal ListView orientation, clipping, scrolling, zero spacing, normal item adapter wiring, drag MIME type, and remote-attention placement remain unchanged.
- Verification: `node tests/tasklistrepresentationqml.test.mjs` failed before implementation because `TaskListRepresentation.qml` did not exist and root still owned the full representation layout; after implementation, `node tests/tasklistrepresentationqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/normaltaskitemqml.test.mjs`; `node tests/remoteattentionitemqml.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklistrepresentationqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `tests/normaltaskitemqml.test.mjs`, `tests/remoteattentionitemqml.test.mjs`, `tests/taskmetricslogic.test.mjs`, `package/contents/ui/TaskListRepresentation.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 123: Context-Menu Trigger Dispatcher

- Status: completed.
- What changed: documented and added `TaskContextMenuActionDispatcher.qml` to own menu item trigger routing from helper-owned action/update descriptors to task-model commands, launcher commands, launcher-activity updates, or empty no-ops; routed `TaskContextMenu.qml` click handlers through the dispatcher.
- Behavior that must remain unchanged: Plasma-native menu item and submenu composition, Pin/Unpin launcher commands, launcher activity update refresh behavior, task-model request validation/execution, structured task action diagnostics, labels, checked states, visible/enabled states, and menu ordering remain unchanged.
- Verification: `node tests/taskcontextmenulogic.test.mjs` failed before implementation because `contextMenuActionRoute` and `TaskContextMenuActionDispatcher.qml` did not exist and the menu still called concrete adapters directly; after implementation, `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskcontextmenulogic.test.mjs`, `package/contents/ui/TaskContextMenuLogic.js`, `package/contents/ui/TaskContextMenuActionDispatcher.qml`, `package/contents/ui/TaskContextMenu.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 124: Action Result Logger Adapter

- Status: completed.
- What changed: documented and added `TaskActionResultLogger.qml` to own action-result diagnostic filtering and warning formatting; routed activation, launcher command, context-menu, and move adapter `actionResult` signals through the logger and removed the action-result helper import and logging function from root.
- Behavior that must remain unchanged: only diagnostic failed action results are logged, expected no-target/no-op results remain quiet, warning text and context serialization stay unchanged, and all producer adapters still emit the same action-result payloads.
- Verification: `node tests/taskactionresultloggerqml.test.mjs` failed before implementation because `TaskActionResultLogger.qml` did not exist and root still owned action-result logging; after implementation, `node tests/taskactionresultloggerqml.test.mjs`; `node tests/taskactivationadapterqml.test.mjs`; `node tests/launchercommandadapterqml.test.mjs`; `node tests/taskcontextmenuadapterqml.test.mjs`; `node tests/taskmoveadapterqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskactionresultloggerqml.test.mjs`, `tests/taskactivationadapterqml.test.mjs`, `tests/launchercommandadapterqml.test.mjs`, `tests/taskcontextmenuadapterqml.test.mjs`, `tests/taskmoveadapterqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskActionResultLogger.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 125: Shared Task-Like Icon Rendering

- Status: completed.
- What changed: documented and added `TaskLikeIcon.qml` to own shared task-like icon rendering and active/highlighted state mapping; routed `TaskItem.qml` and `AttentionItem.qml` through that component while keeping variant fallbacks, sources, badge placement, and layout ownership in the delegates.
- Behavior that must remain unchanged: normal task icons still use the normal fallback and active/highlighted inputs, remote-attention icons still use the remote-attention fallback and highlighted input, number/count badge geometry and z ordering remain unchanged, and title visibility, drag/drop, and task-like interaction remain unchanged.
- Verification: `node tests/tasklikeiconqml.test.mjs` failed before implementation because `TaskLikeIcon.qml` did not exist and delegates still configured `KirigamiPrimitives.Icon` directly; after implementation, `node tests/tasklikeiconqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikeiconqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeIcon.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 126: Shared Task-Like Title Rendering

- Status: completed.
- What changed: documented and added `TaskLikeTitle.qml` to own shared task-like title text rendering; routed `TaskItem.qml` and `AttentionItem.qml` through that component while keeping variant visibility, title text, and normal minimized strikeout inputs in the delegates.
- Behavior that must remain unchanged: normal task titles still strike through only when minimized, remote-attention titles remain unstruck, title text still elides to one line with the same theme color and fill-width behavior, and title visibility thresholds, layout spacers, icons, badges, drag/drop, and interaction remain unchanged.
- Verification: `node tests/taskliketitleqml.test.mjs` failed before implementation because `TaskLikeTitle.qml` did not exist and delegates still configured title `QtQuick.Text` directly; after implementation, `node tests/taskliketitleqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskliketitleqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeTitle.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 127: Shared Task-Like Content Row Geometry

- Status: completed.
- What changed: documented and added `TaskLikeContentRow.qml` to own shared task-like row anchoring, themed-frame content margins, internal Kirigami spacing, and content opacity application; routed `TaskItem.qml` and `AttentionItem.qml` through that component while leaving their variant row children in place.
- Behavior that must remain unchanged: normal task muted-launcher content opacity still comes from `TaskVisualLogic.contentOpacity(...)`, remote-attention content keeps default full opacity, themed frame state inputs remain delegate-local, row child order and spacer fill behavior remain unchanged, and icon/title/badge layout, drag/drop, and interaction remain unchanged.
- Verification: `node tests/tasklikecontentrowqml.test.mjs` failed before implementation because `TaskLikeContentRow.qml` did not exist and delegates still configured `RowLayout` geometry directly; after implementation, `node tests/tasklikecontentrowqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikecontentrowqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeContentRow.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 128: Shared Task-Like Frame Binding

- Status: completed.
- What changed: documented and added `TaskLikeFrame.qml` to own shared task-like frame anchoring, state forwarding, and exposed content margins; routed `TaskItem.qml` and `AttentionItem.qml` through that component while keeping their variant frame state inputs in the delegates.
- Behavior that must remain unchanged: normal task active, attention, drop-hover, hover, launcher, minimized, and muted-launcher frame inputs remain unchanged; remote-attention frame attention and hover inputs remain unchanged; `TaskFrame` still owns themed prefix/opacity decisions and `TaskLikeContentRow` still consumes the same content-margin surface.
- Verification: `node tests/tasklikeframeqml.test.mjs` failed before implementation because `TaskLikeFrame.qml` did not exist and delegates still configured `TaskFrame` directly; after implementation, `node tests/tasklikeframeqml.test.mjs`; `node tests/tasklikecontentrowqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikeframeqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeFrame.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 129: Shared Task-Like Title Visibility

- Status: completed.
- What changed: documented and added `TaskMetricsLogic.taskTitleVisible(...)` as the shared owner for task-like title visibility; routed `TaskItem.qml` and `AttentionItem.qml` through that helper instead of duplicating the boolean formula.
- Behavior that must remain unchanged: disabled titles remain hidden; adaptive slots with `slotWidth <= 0` still show titles when enabled; fixed slots at or above the title threshold still show titles; fixed slots below the threshold still hide titles.
- Verification: `node tests/taskmetricslogic.test.mjs` and `node tests/taskitempresentationlogic.test.mjs` failed before implementation because the helper did not exist and normal tasks still used the inline expression; after implementation, `node tests/taskmetricslogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskliketitleqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskmetricslogic.test.mjs`, `tests/taskitempresentationlogic.test.mjs`, `package/contents/ui/TaskMetricsLogic.js`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 130: Shared Task-Like Content Padding

- Status: completed.
- What changed: documented and added `TaskLikeContentRow.horizontalPadding` as the shared owner for task-like content horizontal padding; routed `TaskItem.qml` and `AttentionItem.qml` natural-width calculations through that property instead of duplicating the frame-margin-plus-spacing expression.
- Behavior that must remain unchanged: normal and remote-attention natural widths still add content row implicit width to left frame margin, right frame margin, and two Kirigami small spacings before applying their existing minimum and maximum width clamps.
- Verification: `node tests/tasklikecontentrowqml.test.mjs` and `node tests/taskmetricslogic.test.mjs` failed before implementation because `TaskLikeContentRow.qml` did not expose `horizontalPadding` and delegates still owned local `contentHorizontalPadding`; after implementation, `node tests/tasklikecontentrowqml.test.mjs`; `node tests/taskmetricslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikecontentrowqml.test.mjs`, `tests/taskmetricslogic.test.mjs`, `package/contents/ui/TaskLikeContentRow.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 131: Shared Task-Like Content Spacers

- Status: completed.
- What changed: documented and added `TaskLikeContentSpacer.qml` to own shared title-hidden fill spacer visibility and layout-fill behavior; routed the normal leading/trailing spacers and remote-attention leading/trailing spacers through that component.
- Behavior that must remain unchanged: the normal leading spacer still fills only when the title is hidden and the item is not a pinned launcher-only delegate; the normal trailing spacer and both remote-attention spacers still fill only when the title is hidden; prefix text, icon/badge containers, title rendering, and natural width calculations remain unchanged.
- Verification: `node tests/tasklikecontentspacerqml.test.mjs`, `node tests/taskvisuallogic.test.mjs`, and `node tests/taskitempresentationlogic.test.mjs` failed before implementation because `TaskLikeContentSpacer.qml` did not exist and delegates still used inline fill spacer `QtQuick.Item` blocks; after implementation, `node tests/tasklikecontentspacerqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/tasklikecontentrowqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikecontentspacerqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `tests/taskitempresentationlogic.test.mjs`, `package/contents/ui/TaskLikeContentSpacer.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 132: Shared Task-Like Implicit Width

- Status: completed.
- What changed: documented and added `TaskMetricsLogic.taskImplicitWidth(...)` as the shared owner for selecting fixed slot width versus natural implicit width; routed `TaskItem.qml` and `AttentionItem.qml` through that helper.
- Behavior that must remain unchanged: positive `slotWidth` still fixes delegate implicit width; zero or negative `slotWidth` still uses the delegate's natural implicit width; normal and remote-attention natural-width calculations remain unchanged.
- Verification: `node tests/taskmetricslogic.test.mjs` failed before implementation because `taskImplicitWidth(...)` did not exist and delegates still used inline implicit-width ternaries; after implementation, `node tests/taskmetricslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/tasklikecontentspacerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskmetricslogic.test.mjs`, `package/contents/ui/TaskMetricsLogic.js`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 133: Shared Task-Like Natural Width Clamp

- Status: completed.
- What changed: documented and added `TaskMetricsLogic.taskNaturalImplicitWidth(...)` as the shared owner for clamping task-like content width plus horizontal padding between variant minimums and the shared maximum slot width; routed `TaskItem.qml` and `AttentionItem.qml` through that helper.
- Behavior that must remain unchanged: normal task natural width still uses the title-aware normal minimum, remote attention still uses its `112` minimum, both delegates still cap natural width at `TaskMetricsLogic.maximumSlotWidth()`, and both still include `TaskLikeContentRow.horizontalPadding` in content width.
- Verification: `node tests/taskmetricslogic.test.mjs` failed before implementation because `taskNaturalImplicitWidth(...)` did not exist and delegates still used inline clamp expressions; after implementation, `node tests/taskmetricslogic.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/tasklikecontentrowqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskmetricslogic.test.mjs`, `tests/tasklikecontentrowqml.test.mjs`, `package/contents/ui/TaskMetricsLogic.js`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 134: Task Entry Projection Diagnostics

- Status: completed.
- What changed: documented and added `TaskEntryLogic.taskEntryDiagnostics(...)` for malformed task-entry projection fields; normal and remote-attention source delegates now emit `projectTaskEntry` action results for diagnostic cases and root routes those results through the existing action-result logger.
- Behavior that must remain unchanged: task-entry fallback/coercion output remains unchanged, normal publication and remote-attention publication/removal still run through their existing source/store flows, valid task rows emit no diagnostics, and malformed rows keep the same visible behavior while gaining internal diagnostics.
- Verification: `node tests/taskentrylogic.test.mjs`, `node tests/normaltasksourceqml.test.mjs`, and `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because `taskEntryDiagnostics(...)` and source action-result wiring did not exist; after implementation, `node tests/taskentrylogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskentrylogic.test.mjs`, `tests/normaltasksourceqml.test.mjs`, `tests/remoteattentionsourceqml.test.mjs`, `package/contents/ui/TaskEntryLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, `package/contents/ui/main.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 135: Shared Task Entry Diagnostic Reporter

- Status: completed.
- What changed: documented and added `TaskEntryDiagnosticReporter.qml` as the shared QML adapter for task-entry projection diagnostics; normal and remote-attention source delegates now provide source metadata and roles to that reporter instead of duplicating diagnostic context, repeated-signature suppression, and `projectTaskEntry` action-result mapping.
- Behavior that must remain unchanged: checkpoint 134 diagnostics keep the same action, codes, context fields, diagnostic flag, and repeated-signature suppression behavior; normal task publication, remote-attention publication, task fallback/coercion, and action-result logging remain unchanged.
- Verification: `node tests/taskentrydiagnosticreporterqml.test.mjs`, `node tests/normaltasksourceqml.test.mjs`, and `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because `TaskEntryDiagnosticReporter.qml` did not exist and both sources still owned local diagnostic mapping; after implementation, `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskentrylogic.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskentrydiagnosticreporterqml.test.mjs`, `tests/normaltasksourceqml.test.mjs`, `tests/remoteattentionsourceqml.test.mjs`, `package/contents/ui/TaskEntryDiagnosticReporter.qml`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 136: Task Entry Diagnostic Action Result Helper

- Status: completed.
- What changed: documented and added `TaskActionLogic.taskEntryDiagnosticResult(...)` as the pure owner of `projectTaskEntry` action-result construction; `TaskEntryDiagnosticReporter.qml` now supplies diagnostic context and repeated-signature suppression, then delegates result creation to that helper.
- Behavior that must remain unchanged: task-entry diagnostics keep the same action, codes, context fields, `ok: false`, `diagnostic: true`, and log filtering behavior; source delegates still publish normal and remote-attention entries through the same flows.
- Verification: `node tests/taskactionlogic.test.mjs` and `node tests/taskentrydiagnosticreporterqml.test.mjs` failed before implementation because `taskEntryDiagnosticResult(...)` did not exist and the reporter still called `TaskActionLogic.actionResult("projectTaskEntry", ...)` directly; after implementation, `node tests/taskactionlogic.test.mjs`; `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/taskentrylogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskactionlogic.test.mjs`, `tests/taskentrydiagnosticreporterqml.test.mjs`, `package/contents/ui/TaskActionLogic.js`, `package/contents/ui/TaskEntryDiagnosticReporter.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 137: Shared Task-Like Focus Surface

- Status: completed.
- What changed: documented `TaskLikeInteraction.qml` as the shared owner of task-like focusability, Menu-key handling, Button color-set binding, hover/focus highlighting, right-click context-menu focus handoff, and left-click activation; `TaskItem.qml` and `AttentionItem.qml` now provide variant data/layout and visual-parent routing without duplicating the focus/key/theme surface.
- Behavior that must remain unchanged: normal and remote-attention delegates remain keyboard focusable, still open context menus through the same zero-delay trigger path, still highlight on hover/focus/open-menu state, still use the Button color set, and keep activation, context-menu request payloads, drag/drop behavior, icon/title/badge layout, and menu placement unchanged.
- Verification: `node tests/taskvisuallogic.test.mjs` failed before implementation because `TaskItem.qml` still owned `activeFocusOnTab`, key forwarding, and Button color-set binding; after implementation, `node tests/taskvisuallogic.test.mjs`; `node tests/taskinteractionlogic.test.mjs`; `node tests/tasklikeframeqml.test.mjs`; `node tests/tasklikecontentrowqml.test.mjs`; `node tests/tasklikecontentspacerqml.test.mjs`; `node tests/tasklikeiconqml.test.mjs`; `node tests/taskliketitleqml.test.mjs`; `node tests/normaltaskitemqml.test.mjs`; `node tests/remoteattentionitemqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeInteraction.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 138: Shared Task-Like Icon Slot

- Status: completed.
- What changed: documented and added `TaskLikeIconSlot.qml` as the shared owner of task-like icon container layout, icon extent sizing, and `TaskLikeIcon` anchoring; `TaskItem.qml` and `AttentionItem.qml` now supply variant badge content inside that shared slot instead of repeating the icon container.
- Behavior that must remain unchanged: normal slot badge lower-left anchoring, overlay visibility, and scale remain unchanged; remote-attention count badge upper-right anchoring, visibility, and scale remain unchanged; normal and remote icon fallback/source/highlight/active inputs, title layout, activation, context-menu, and drag/drop behavior remain unchanged.
- Verification: `node tests/tasklikeiconslotqml.test.mjs`, `node tests/tasklikeiconqml.test.mjs`, and `node tests/taskvisuallogic.test.mjs` failed before implementation because `TaskLikeIconSlot.qml` did not exist and delegates still instantiated `TaskLikeIcon` directly; after implementation, `node tests/tasklikeiconslotqml.test.mjs`; `node tests/tasklikeiconqml.test.mjs`; `node tests/taskvisuallogic.test.mjs`; `node tests/taskitempresentationlogic.test.mjs`; `node tests/normaltaskitemqml.test.mjs`; `node tests/remoteattentionitemqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/tasklikeiconslotqml.test.mjs`, `tests/tasklikeiconqml.test.mjs`, `tests/taskvisuallogic.test.mjs`, `tests/taskitempresentationlogic.test.mjs`, `package/contents/ui/TaskLikeIconSlot.qml`, `package/contents/ui/TaskItem.qml`, `package/contents/ui/AttentionItem.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 139: Internal Task-Like Focus Handoff

- Status: completed.
- What changed: documented and removed the obsolete delegate-supplied `focusTarget` surface from `TaskLikeInteraction.qml`; the shared interaction component now uses its own active-focus state for highlighting and focus handoff, while delegates continue to pass only visual parents for menu placement.
- Behavior that must remain unchanged: normal and remote-attention delegates remain keyboard focusable, hover/focus/open-menu highlighting stays equivalent for current callers, Menu-key/right-click context-menu requests still force focus before emission, visual-parent menu placement remains delegate-routed, and left-click activation remains unchanged.
- Verification: `node tests/taskvisuallogic.test.mjs` failed before implementation because `TaskLikeInteraction.qml` still exposed `focusTarget` and used it for highlighting/focus handoff; after implementation, `node tests/taskvisuallogic.test.mjs`; `node tests/taskinteractionlogic.test.mjs`; `node tests/tasklikeframeqml.test.mjs`; `node tests/tasklikecontentrowqml.test.mjs`; `node tests/tasklikecontentspacerqml.test.mjs`; `node tests/tasklikeiconqml.test.mjs`; `node tests/tasklikeiconslotqml.test.mjs`; `node tests/taskliketitleqml.test.mjs`; `node tests/normaltaskitemqml.test.mjs`; `node tests/remoteattentionitemqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskvisuallogic.test.mjs`, `package/contents/ui/TaskLikeInteraction.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 140: Task Entry List Role Diagnostics

- Status: completed.
- What changed: documented and added task-entry diagnostics for present malformed list-role shapes on `activities` and `virtualDesktops`, so malformed activity/desktop role data is observable without changing projection behavior.
- Behavior that must remain unchanged: missing optional list roles stay quiet; valid arrays and array-like role values stay quiet; `createBaseTaskEntry(...)` keeps the same current coercion/fallback output; normal and remote source delegates keep routing diagnostics through `TaskEntryDiagnosticReporter.qml` and `TaskActionLogic.taskEntryDiagnosticResult(...)`.
- Verification: `node tests/taskentrylogic.test.mjs` failed before implementation because malformed list roles produced no diagnostics; after implementation, `node tests/taskentrylogic.test.mjs`; `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskentrylogic.test.mjs`, `package/contents/ui/TaskEntryLogic.js`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 141: Source List Diagnostic Role Snapshots

- Status: completed.
- What changed: documented and expanded normal and remote-attention source diagnostic role snapshots to include raw `Activities` and `VirtualDesktops` values, so the existing task-entry list-role diagnostics can be emitted from the runtime source adapters.
- Behavior that must remain unchanged: normal and remote task projection output, qualification, publication/removal sequencing, repeated diagnostic suppression, action-result mapping, and visible fallback behavior remain unchanged; only diagnostic input coverage grows.
- Verification: `node tests/normaltasksourceqml.test.mjs` and `node tests/remoteattentionsourceqml.test.mjs` failed before implementation because source reporter roles included only `index` and `modelIndex`; after implementation, `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/taskentrylogic.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/normaltasksourceqml.test.mjs`, `tests/remoteattentionsourceqml.test.mjs`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 142: Base Boolean Role Diagnostics

- Status: completed.
- What changed: documented and added task-entry diagnostics for present malformed base boolean role shapes on `demandingAttention`, `isOnAllVirtualDesktops`, and `isWindow`; normal and remote-attention source diagnostic role snapshots now pass those raw roles to the shared reporter.
- Behavior that must remain unchanged: `boolValue(...)` and `createBaseTaskEntry(...)` keep their current coercion output; missing boolean roles stay quiet; normal and remote task projection, qualification, publication/removal sequencing, repeated diagnostic suppression, action-result mapping, and visible fallback behavior remain unchanged.
- Verification: `node tests/taskentrylogic.test.mjs`, `node tests/normaltasksourceqml.test.mjs`, `node tests/remoteattentionsourceqml.test.mjs`, and `node tests/taskentrydiagnosticreporterqml.test.mjs` failed before implementation because boolean diagnostics and reporter inputs were missing; after implementation, `node tests/taskentrylogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskactionresultloggerqml.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskentrylogic.test.mjs`, `tests/normaltasksourceqml.test.mjs`, `tests/remoteattentionsourceqml.test.mjs`, `tests/taskentrydiagnosticreporterqml.test.mjs`, `package/contents/ui/TaskEntryLogic.js`, `package/contents/ui/NormalTaskSource.qml`, `package/contents/ui/RemoteAttentionSource.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Completed Checkpoint 143: Normal Launcher Boolean Diagnostics

- Status: completed.
- What changed: documented and added task-entry diagnostics for present malformed normal-task launcher boolean role shape on `isLauncher`; `NormalTaskSource.qml` now passes raw `model.IsLauncher` to the shared diagnostic reporter.
- Behavior that must remain unchanged: `createNormalTaskEntry(...)` keeps coercing `isLauncher` through the existing `Boolean(...)` path; missing `isLauncher` stays quiet; remote-attention diagnostics remain unchanged; normal task publication, qualification, pin-state composition, rendering, repeated diagnostic suppression, and action-result logging remain unchanged.
- Verification: `node tests/taskentrylogic.test.mjs`, `node tests/normaltasksourceqml.test.mjs`, and `node tests/taskentrydiagnosticreporterqml.test.mjs` failed before implementation because `isLauncher` diagnostics and reporter input were missing; after implementation, `node tests/taskentrylogic.test.mjs`; `node tests/normaltasksourceqml.test.mjs`; `node tests/taskentrydiagnosticreporterqml.test.mjs`; `node tests/remoteattentionsourceqml.test.mjs`; `node tests/taskactionlogic.test.mjs`; `node tests/taskcontextmenulogic.test.mjs`; `just lint-js-host`; `just lint-qml`; `just test-host`; `just test`; `just check`; `git diff --check`.
- Files changed: `docs/architecture/ARCHITECTURE.md`, `tests/taskentrylogic.test.mjs`, `tests/normaltasksourceqml.test.mjs`, `tests/taskentrydiagnosticreporterqml.test.mjs`, `package/contents/ui/TaskEntryLogic.js`, `package/contents/ui/NormalTaskSource.qml`, and `DESIGN_REVIEW_PROGRESS.md`.

## Remaining Follow-Up Work

- Context menu: QML-local role snapshot passthrough wrappers have been removed, activity/virtual-desktop entry construction now comes from tested helper snapshots, New Instance/Move/Resize descriptors, Minimize/Maximize descriptors, Keep Above/Below descriptors, Fullscreen/Shade/No Border descriptors, Capture/Close descriptors, Virtual Desktop descriptors, Activity descriptors, and Launcher Activity descriptors consume tested live-role snapshots, all task-model command descriptors are helper-owned, launcher pin state and Pin/Unpin action descriptors are helper-owned, launcher activity update-to-command adaptation is helper-owned, and the launcher All Activities and per-activity next-state adapters are helper-owned. The menu now consumes one broader tested action-section snapshot and one broader tested role snapshot instead of directly assembling those models in QML, `TaskContextMenuPlatformState.qml` owns menu ActivityInfo/VirtualDesktopInfo state, `TaskContextMenuRoleState.qml` owns the live role ID/source adapter boundary, `TaskContextMenuTaskCommandAdapter.qml` owns direct task-model command execution, `TaskContextMenuLauncherActivityAdapter.qml` owns launcher-activity refresh/update side effects, `TaskContextMenuLauncherState.qml` owns launcher list/position/pin-state reads, `TaskContextMenuActionDispatcher.qml` owns item trigger routing, `TaskContextMenuAdapter.qml` owns menu lifecycle creation/wiring and the default normal task-model injection, and `LauncherCommandAdapter.qml` owns root-side launcher command effects. Remaining context-menu work should focus on any remaining signal-surface narrowing only where it can preserve Plasma menu behavior.
- Visible item composer / remote attention: normal task rendering and rendered remote-attention activation/metadata now consume composed descriptors, `NormalTaskItem.qml` owns the normal rendered binding around `TaskItem`, and `RemoteAttentionSource.qml` owns the remote-attention model, state snapshot, source-facing count/target snapshot, rendered item surface, activation intent, and context-menu task-model injection. `RemoteAttentionItem.qml` now owns the single rendered binding around `AttentionItem`. The obsolete per-normal-index visible-item lookup API and root-owned `remoteAttentionVisibleItem` binding have been removed. Remaining remote-attention work should focus on broader task-like chrome sharing only if it stays behavior-preserving.
- Root/controller ownership: applet activity/desktop platform state, launcher revision, current-activity checks, and visible launcher position lookup now live in `TaskPlatformState.qml`; launcher sync state, guarded model/config writes, reconciliation, and sync diagnostics now live in `LauncherSyncAdapter.qml`; activation request validation, failure emission, and effect dispatch now live in `TaskActivationAdapter.qml`; action-result diagnostic filtering and warning formatting now live in `TaskActionResultLogger.qml`; context-menu lifecycle creation/wiring now lives in `TaskContextMenuAdapter.qml`; context-menu launcher command effects now live in `LauncherCommandAdapter.qml`; normal task store state now lives in `NormalTaskStoreAdapter.qml`; drag/drop movement orchestration now lives in `TaskMoveAdapter.qml`; normal rendered item field binding now lives in `NormalTaskItem.qml`; full representation layout and rendered task-list composition now live in `TaskListRepresentation.qml`; root still owns unavoidable `TasksModel` instantiation, launcher-list change notification, the external shortcut forwarding hook, and top-level adapter wiring.
- Scope policy: model filter settings and local qualifiers now have a named owner; task-specific qualifier re-export facades and generic activity facades in task and launcher modules have been removed.
- Metrics: root layout, normal task, and attention task size constants, task-like implicit width selection, and task-like title visibility now come from `TaskMetricsLogic.js`. Badge dimensions remain badge-local rendering policy.
- Task entry diagnostics: `TaskEntryLogic.js` now classifies malformed numeric indexes and model-index shapes, and normal/remote source adapters route those diagnostics through a shared diagnostic reporter. Remaining role-projection work should expand diagnostics only where a field is truly required and then aggregate or rate-limit at the publication boundary if runtime volume warrants it.
- Mutation results: launcher activity updates and normal-task move decisions now expose reason-coded results, and root drag/drop consumes typed move results before projecting booleans to delegates. Unexpected or stale drag/drop rejections now produce structured internal diagnostics while expected policy no-ops remain quiet.
- Interaction helpers: normal task drag MIME payload creation, source-index parsing, drop acceptance policy, task-like context-menu request payload construction, shared task-like activation/context-menu trigger wiring, shared task-like frame binding, shared task-like icon rendering, shared task-like title rendering, shared task-like content row geometry, shared task-like content horizontal padding, and shared task-like title-hidden content spacers now have focused owners. Remaining task-like chrome work is extracting any further shared frame/content layout only where it stays behavior-preserving.
