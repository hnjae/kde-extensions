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

## Remaining Follow-Up Work

- Context menu: direct role snapshot passthrough wrappers have been removed. Keep the remaining live-role boundary helpers (`roleData`, `boolRole`, `roleIds`, `roleSource`, and `roleSnapshot`) until a larger menu action-model or adapter extraction can preserve that boundary with less QML-local code.
- Visible item composer / remote attention: rendered remote-attention activation and metadata now consume composed descriptors, and `RemoteAttentionSource.qml` owns the remote-attention model, state snapshot, and activation adapter. Full remote-attention removability still requires shrinking root's rendered binding and context-menu wiring to one source-owned item surface.
- Scope policy: model filter settings and local qualifiers now have a named owner, and task-specific qualifier re-export facades have been removed. Remaining scope cleanup is activity-helper facade removal in task and launcher modules.
