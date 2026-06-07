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

## Remaining Follow-Up Work

- Context menu: continue shrinking thin QML wrapper functions around checked-state helpers where practical.
