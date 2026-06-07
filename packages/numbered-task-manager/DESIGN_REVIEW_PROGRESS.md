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

## Remaining Follow-Up Work

- Context menu: QML-local role snapshot passthrough wrappers have been removed, activity/virtual-desktop entry construction now comes from tested helper snapshots, New Instance/Move/Resize descriptors, Minimize/Maximize descriptors, Keep Above/Below descriptors, Fullscreen/Shade/No Border descriptors, Capture/Close descriptors, Virtual Desktop descriptors, and activity state consume tested live-role snapshots, all task-model command descriptors are helper-owned, launcher pin state and Pin/Unpin action descriptors are helper-owned, Launcher Activities enabled/visible state is helper-owned, launcher activity update-to-command adaptation is helper-owned, and the launcher All Activities and per-activity next-state adapters are helper-owned. Keep the remaining live-role boundary helpers (`roleIds`, `roleSource`, `taskRoles`, and the tested JS `roleData`/`boolRoleData` primitives) until a larger menu action-model or adapter extraction can preserve that boundary with less QML-local code. Remaining context-menu work is moving broader section descriptors into action-model outputs rather than item-local role reads.
- Visible item composer / remote attention: rendered remote-attention activation and metadata now consume composed descriptors, and `RemoteAttentionSource.qml` owns the remote-attention model, state snapshot, and activation adapter. Full remote-attention removability still requires shrinking root's rendered binding and context-menu wiring to one source-owned item surface.
- Scope policy: model filter settings and local qualifiers now have a named owner; task-specific qualifier re-export facades and generic activity facades in task and launcher modules have been removed.
- Metrics: root layout, normal task, and attention task size constants now come from `TaskMetricsLogic.js`. Badge dimensions remain badge-local rendering policy.
- Mutation results: launcher activity updates and normal-task move decisions now expose reason-coded results, and root drag/drop consumes typed move results before projecting booleans to delegates. Unexpected or stale drag/drop rejections now produce structured internal diagnostics while expected policy no-ops remain quiet.
- Interaction helpers: normal task drag MIME payload creation, source-index parsing, drop acceptance policy, task-like context-menu request payload construction, and shared task-like activation/context-menu trigger wiring now have focused owners. Remaining task-like chrome work is extracting shared frame/content layout after the interaction surface stays stable.
