# Design Review: Correct End State

## Executive Summary

This review found no evidence that the package needs a rewrite or a new framework. The current architecture already has a useful intent layer in `docs/spec/SPEC.md` and `docs/architecture/ARCHITECTURE.md`, and several domain rules are extracted into small tested QML JavaScript modules. The main architectural risk is that the most important behavior is still assembled through root-level QML orchestration, hidden delegate lifecycle side effects, and live Plasma model mutation surfaces.

The most important correct end state is a boring one: keep KDE Plasma's `org.kde.taskmanager` APIs, keep the existing pure helper strategy, but introduce explicit ownership boundaries for task composition, launcher persistence, remote attention, shortcut slot policy, task role projection, and context-menu action state. `main.qml` should become an applet composition shell rather than the owner of nearly every feature.

The strongest correctness risks are around representable invalid states: task activity toggles can produce the same `[]` command as the explicit "All Activities" action, launcher identity is URL-only even though duplicate serialized launchers are representable, normal task composition assumes non-empty unique `entryKey` values without enforcing that invariant, and remote-attention fallback identity is unstable when `WinIdList` is unavailable. These are higher impact than cosmetic cohesion issues because they can change user-visible targeting, scope, or ordering.

## Top Design Risks

1. Activity, launcher, task-entry, and remote-attention identity invariants are not all centrally protected, so incorrect scope or ordering can look like ordinary state.
2. `main.qml` owns task observation, publication maps, manual order, launcher persistence, drag reorder orchestration, remote-attention state, shortcut activation, menu lifecycle, and layout, making feature changes high-impact.
3. Launcher behavior spans `LauncherListLogic.js`, `TaskModelLogic.js`, `TaskContextMenu.qml`, `main.qml`, `TasksModel.launcherList`, and `Plasmoid.configuration.launchers`, so there is no single command owner for pinning, activity scope, persistence, or pinned reorder.
4. `TaskContextMenu.qml` mixes rendering, live role reads, action policy, workspace discovery, launcher mutation, and direct task-model requests, making action behavior hard to verify or remove in groups.
5. User actions and backend effects commonly collapse into silent `false`, `null`, empty string, or early-return outcomes, so expected no-ops, stale model state, backend rejection, and internal mismatch are not distinguishable.

## Single Source of Truth Violations

### Finding: Slot and shortcut policy is split across activation and rendering

#### Evidence

- `package/contents/ui/main.qml:42-64` implements shortcut activation and treats `index === 9` as the special final-item path for `Meta+0`.
- `package/contents/ui/main.qml:531` renders normal slot numbers with `index < 9 ? index + 1 : 0`.
- `package/contents/ui/TaskItemPresentationLogic.js:6-9` independently defines valid slot numbers as `1` through `9`.
- `package/contents/ui/AttentionItem.qml:71-78` uses `NumberBadge` for the remote-attention count while the "do not render a `0` badge" policy is enforced elsewhere.

#### Current state

The rules "slots 1 through 9 are numbered", "`Meta+0` activates the final visible item", and "remote attention is final when present but unbadged as slot 0" are represented by local literals and branching in multiple files.

#### Design concern

Rendering and activation can drift. A future change to shortcut count, final-item targeting, or remote-attention ordering could update `activateTaskAtIndex()` without updating badge assignment, or vice versa.

#### Correct end state

A single `SlotPolicyLogic.js` or equivalent policy module should own numbered slot count, final shortcut index, slot label derivation, final-item activation target selection, and whether an item gets a slot badge. QML should use that policy and then perform only UI/model effects such as `requestActivate`.

#### Suggested migration

Add `slotNumberForNormalIndex(index)`, `isFinalShortcutIndex(index)`, and `activationTargetForShortcut(index, normalEntries, remoteAttentionTarget)` as pure functions. Migrate `main.qml` activation and slot-number binding first, then make `TaskItemPresentationLogic.js` consume the same constants.

#### Acceptance criteria

- No raw `9`, `index === 9`, or `index < 9` shortcut-slot policy remains in QML except through named policy functions.
- Unit tests cover `Meta+1` through `Meta+9`, `Meta+0`, remote attention as the final item, and unnumbered tasks after slot 9 through one policy module.
- Rendering and activation derive from the same slot policy.

#### Priority

P1

### Finding: Task role projection and fallback defaults have multiple owners

#### Evidence

- `package/contents/ui/TaskEntryLogic.js:61-101` owns generic coercion, title/icon fallback, and base task entry creation.
- `package/contents/ui/TaskModelLogic.js:4-52` defines normal task entry shape and the normal fallback icon `"application-x-executable"`.
- `package/contents/ui/RemoteAttentionLogic.js:4-13` defines remote-attention entry shape and the remote fallback icon `"dialog-warning"`.
- `package/contents/ui/main.qml:359-400` maps raw `TasksModel` roles into normal task fields.
- `package/contents/ui/main.qml:443-456` maps raw `TasksModel` roles into remote-attention fields.
- `package/contents/ui/TaskContextMenu.qml:57-92` redefines live role access and fallback helpers through `taskModel.data(modelIndex, role)`.
- `package/contents/ui/TaskItem.qml:26` and `package/contents/ui/AttentionItem.qml:19` repeat fallback icon defaults at the visual layer.

#### Current state

Normal tasks, remote-attention tasks, menu actions, and visual delegates all know pieces of the task-entry contract. Some paths use `TaskEntryLogic`; other paths directly coerce or hard-code fallback values.

#### Design concern

There is no single schema or projection owner for task entries. Changes to role preference, required roles, title fallback, launcher URL fallback, icon fallback, or model-index handling require auditing multiple QML and JS files.

#### Correct end state

A role projection layer, either inside `TaskEntryLogic.js` or a narrower `TaskRoleProjectionLogic.js`, should own field names, coercion, required/optional role classification, fallback icons, and launcher URL preference. UI components may still request live role values for correctness-sensitive actions, but they should do so through shared projection helpers or shared field definitions.

#### Suggested migration

Extract named constants for fallback icons and role names. Add projection helpers for normal entries, remote-attention entries, and live menu snapshots. Migrate `TaskContextMenu.qml` role helpers to shared coercion/fallback logic while preserving the documented behavior that menu mutations read live model roles.

#### Acceptance criteria

- Launcher URL fallback order is defined once.
- Normal and remote entry defaults are defined once.
- Context-menu role helpers use shared coercion/fallback functions.
- Tests cover the shared projection contract and required/optional role diagnostics.

#### Priority

P1

### Finding: Activity-scope primitives are exposed through multiple public module surfaces

#### Evidence

- `package/contents/ui/ActivityScopeLogic.js:4-78` defines the null activity UUID, list containment, de-duplication, all-activities detection, normalization, and current-activity membership.
- `package/contents/ui/TaskActivityLogic.js:4-28` includes `ActivityScopeLogic.js` and re-exports `allActivitiesId`, `stringListContains`, `uniqueStringList`, `activitiesAreAll`, `normalizedActivityList`, and `isInCurrentActivity`.
- `package/contents/ui/LauncherListLogic.js:4-70` includes `ActivityScopeLogic.js` and wraps or re-exports several generic activity primitives before launcher-specific code.
- `package/contents/ui/TaskContextMenu.qml:118-139` uses generic activity predicates through `TaskActivityLogic`.
- `package/contents/ui/main.qml:190-191` uses `TaskActivityLogic.isInCurrentActivity`.
- `tests/activityscopelogic.test.mjs:20`, `tests/taskactivitylogic.test.mjs:21`, and `tests/launcherlistlogic.test.mjs:30` repeat the null UUID literal.

#### Current state

`ActivityScopeLogic.js` is the intended primitive owner, but task and launcher modules expose overlapping pass-through APIs. Call sites can depend on a feature module for generic activity semantics.

#### Design concern

The all-activities sentinel and activity-list operations are easy to drift because the same concept is reachable through several modules. Task and launcher differences may be valid, but they are not expressed as explicit policies over one shared activity abstraction.

#### Correct end state

`ActivityScopeLogic.js` should be the only public owner of generic activity scope. `TaskActivityLogic.js` should expose task-specific mutation behavior. `LauncherListLogic.js` should expose launcher serialization and launcher-specific activity update behavior. Generic wrappers can remain temporarily during migration but should not be the long-term API.

#### Suggested migration

Move generic activity calls in QML to `ActivityScopeLogic.js`. Keep task and launcher wrapper exports temporarily while call sites move. Remove pass-through exports once unused, and keep task/launcher tests focused on feature-specific policy.

#### Acceptance criteria

- Generic functions such as `activitiesAreAll`, `normalizedActivityList`, `stringListContains`, and `isInCurrentActivity` have one public owner.
- `TaskActivityLogic.js` exposes task activity mutation rules, not generic activity primitives.
- `LauncherListLogic.js` exposes launcher-list and serialized-launcher behavior, not general-purpose activity utility wrappers.
- The documented ownership in `docs/architecture/ARCHITECTURE.md:19-23` matches the module API used by callers.

#### Priority

P2

### Finding: Shared `TasksModel` configuration policy is duplicated inline

#### Evidence

- `package/contents/ui/main.qml:316-330` defines the normal `TaskManager.TasksModel`.
- `package/contents/ui/main.qml:340-349` defines the remote-attention `TaskManager.TasksModel`.
- Both models repeat shared policy values including `filterByScreen: false`, `groupMode: TaskManager.TasksModel.GroupDisabled`, `sortMode: TaskManager.TasksModel.SortManual`, and `virtualDesktop: virtualDesktopInfo.currentDesktop`.

#### Current state

Normal and attention models intentionally differ on activity and virtual-desktop filtering, but their shared model policy is repeated directly in two QML blocks.

#### Design concern

Shared policy and deliberate differences are not named separately. A future change to grouping, screen filtering, sort mode, or desktop binding could be applied to one model and missed in the other.

#### Correct end state

Shared task-manager model policy should have one named owner or one clear policy block, with normal-only and attention-only differences visible beside it.

#### Suggested migration

Add static characterization checks for shared model settings, then extract or name shared policy values in QML. Leave normal-only and attention-only filter settings explicit.

#### Acceptance criteria

- Shared model settings have one owner or one named policy block.
- Normal-only and attention-only differences are documented in code.
- Tests fail if grouping, screen filtering, or sort mode drift unintentionally between the two models.

#### Priority

P2

## Invariant and Correctness Risks

### Finding: Task activity toggle can silently convert a specifically scoped task to all activities

#### Evidence

- `package/contents/ui/ActivityScopeLogic.js:37-50` treats an empty activity list or a list containing KDE's null activity UUID as all activities.
- `package/contents/ui/TaskActivityLogic.js:30-57` removes a toggled activity and returns `nextActivities`, even when that list becomes empty.
- `package/contents/ui/TaskContextMenu.qml:130-135` calls `taskModel.requestActivities(modelIndex, TaskActivityLogic.taskActivitiesAfterToggle(...))`.
- `package/contents/ui/TaskContextMenu.qml:484-490` has a separate explicit "All Activities" action that also sends `[]`.
- `package/contents/ui/LauncherListLogic.js:159-167` avoids the analogous launcher case by falling back to the current activity when removing the last specific launcher activity.

#### Current state

Clicking the only checked specific task activity can produce `[]`, which KDE interprets as all activities. The explicit "All Activities" action also produces `[]`.

#### Design concern

Two conceptually different user actions collapse into the same backend command. The invariant "a specific activity toggle should not accidentally select all activities" is not centrally protected for task activities.

#### Correct end state

`TaskActivityLogic.js` should own a named task activity mutation policy that separates explicit all-activities selection from specific activity toggles. Toggling the last specific activity should either no-op or fall back to the current activity, depending on intended behavior, and that policy should be named and tested.

#### Suggested migration

Add characterization tests for toggling the last specific task activity. Introduce helpers such as `taskActivitiesAfterSpecificToggle(activities, activityId, currentActivity)` and `taskActivitiesForAllActivitiesAction()`. Update `TaskContextMenu.qml` so only the "All Activities" menu item intentionally requests `[]`.

#### Acceptance criteria

- Toggling a specific task activity cannot return `[]` unless the function name and tests explicitly document that as intended.
- The "All Activities" menu item is the only call path that intentionally requests `[]`.
- Task and launcher activity mutation policies are either aligned or explicitly documented where they differ.

#### Priority

P1

### Finding: Launcher identity is URL-only even though duplicate serialized launchers are representable

#### Evidence

- `package/contents/ui/LauncherListLogic.js:10-17` normalizes launcher lists by filtering empty entries only; it does not reject or collapse duplicate launcher URLs.
- `package/contents/ui/LauncherListLogic.js:73-96` parses activity-scoped serialized launchers into `{ activities, url }`.
- `package/contents/ui/LauncherListLogic.js:203-218` resolves a launcher position from `launcherUrl`.
- `package/contents/ui/LauncherListLogic.js:249-269` resolves pinned launcher global position by `pinnedLauncherUrl || launcherUrl`, falling back to the first parsed launcher with the same URL.
- `package/contents/ui/main.qml:177-187` computes visible launcher position from `launcherUrl` and `tasksModel.launcherPosition(url)`.

#### Current state

The persisted launcher list can contain multiple serialized entries with the same parsed URL, including entries with different activity prefixes. Movement, visibility, and activity updates address launchers by URL or URL-derived position callbacks.

#### Design concern

If duplicate same-URL launchers enter configuration or the model, operations can target the first matching URL or the position returned by KDE's URL-based lookup. The invariant "this visible pinned slot maps to this persisted launcher entry" is weak.

#### Correct end state

The code should choose and enforce one launcher identity model. Either pinned launchers are unique by canonical URL and duplicates are removed/rejected during normalization, or launcher identity includes a stable global list position or serialized entry token so duplicate URLs are first-class and all operations target the selected slot.

#### Suggested migration

Add tests with duplicate same-URL launchers, including activity-prefixed variants. Then either strengthen `normalizedLauncherList()` to enforce uniqueness or change movement/activity APIs to pass a launcher-entry identity instead of URL alone.

#### Acceptance criteria

- Duplicate launcher entries cannot silently produce ambiguous move or activity updates.
- Tests cover duplicate same-URL launcher inputs.
- `visibleLauncherPosition()`, `pinnedLauncherGlobalPosition()`, and launcher activity updates use the same identity policy.

#### Priority

P1

### Finding: Normal task composition depends on non-empty unique `entryKey` without enforcing it

#### Evidence

- `package/contents/ui/TaskModelLogic.js:25` coerces missing `entryKey` to an empty string.
- `package/contents/ui/main.qml:362-373` creates `taskInfo` with `entryKey: publishedKey`, which is initially empty.
- `package/contents/ui/main.qml:407-414` relies on `syncTask()` skipping publication until `publishedKey` exists, then overwrites `task.entryKey`.
- `package/contents/ui/TaskModelLogic.js:116-117` discards map keys and composes from map values.
- `package/contents/ui/TaskModelLogic.js:156-172`, `package/contents/ui/TaskModelLogic.js:188-196`, and `package/contents/ui/TaskModelLogic.js:203-215` use `entry.entryKey` for consumed-entry tracking and manual ordering.
- `package/contents/ui/TaskModelLogic.js:240-243` builds manual order from `entry.entryKey`.

#### Current state

The normal task pipeline works only if every published entry has a non-empty unique `entryKey`. That invariant is maintained by root QML publication timing, not by the pure composition function itself.

#### Design concern

Duplicate or empty keys are representable and can silently collapse entries in `consumedKeys` or `unpinnedByKey`, corrupting visible composition or manual order.

#### Correct end state

Normal task identity should be owned by the publication collection, not by a mutable field that can be empty or duplicated. `composeNormalTaskEntries()` should receive keyed entries and use the collection key as canonical identity, or explicitly validate non-empty unique keys and return a structured invalid-state result.

#### Suggested migration

Add tests for empty and duplicate `entryKey` values. Then refactor the composition input to preserve the map key alongside each entry, or add explicit validation that callers must handle.

#### Acceptance criteria

- Empty and duplicate normal task keys are rejected, normalized, or impossible to construct.
- Manual order uses the same canonical identity as publication/removal.
- `composeNormalTaskEntries()` no longer silently drops or overwrites entries due to key collisions.

#### Priority

P1

### Finding: Remote attention fallback identity is unstable when `WinIdList` is missing

#### Evidence

- `package/contents/ui/RemoteAttentionLogic.js:36-42` uses `winIds` when present, but falls back to `"row:" + row + ":" + launcherUrl + ":" + title`.
- `package/contents/ui/main.qml:436-458` passes the repeater `index` into `remoteAttentionKey(...)`.
- `package/contents/ui/main.qml:464-477` republishes attention entries when `taskKey` changes.
- `package/contents/ui/RemoteAttentionLogic.js:117-127` appends unknown qualifying keys to the end of attention order, which defines the target.
- `package/contents/ui/RemoteAttentionLogic.js:45-60` chooses the target as the last ordered entry.
- `tests/remoteattentionlogic.test.mjs:83-90` explicitly tests the empty-`winIds` fallback key.

#### Current state

Remote attention has stable identity when `WinIdList` exists. Without it, identity includes model row and title, both of which can change without the window newly entering the demanding-attention state.

#### Design concern

The spec requires targeting the task most recently observed entering demanding-attention state. A row/title-derived fallback can make row movement or title changes look like identity changes. `previousKey` replacement mitigates some cases, but it does not make the identity stable.

#### Correct end state

Remote attention identity should come from a stable domain identifier. Prefer `WinIdList` as required for real window attention entries; otherwise use a stable persistent model-index token or explicitly enter a degraded mode that does not claim recency ordering beyond model order.

#### Suggested migration

Confirm whether KDE `TasksModel` can expose window rows without `WinIdList`. If it cannot, remove or hard-fail the fallback for window rows. If it can, add tests for title changes and row reordering with empty `WinIdList`, then introduce a stable fallback identity.

#### Acceptance criteria

- A title change or row reorder does not change the logical identity of an already tracked remote attention task.
- Recency ordering changes only on an observed `false -> true` demanding-attention transition or documented startup ordering.
- Empty-`WinIdList` behavior is tested against the intended KDE model reality.

#### Priority

P1, uncertain: needs KDE `TasksModel` evidence on whether real window rows can lack `WinIdList`.

### Finding: Task action validity is enforced by menu bindings rather than a central command gate

#### Evidence

- `package/contents/ui/TaskEntryLogic.js:55-58` treats any truthy object without a `valid` property as a valid model index.
- `tests/taskentrylogic.test.mjs:57-60` asserts `hasValidModelIndex({}) === true`.
- `package/contents/ui/main.qml:264-278` validates the model index when creating the context menu.
- `package/contents/ui/TaskContextMenu.qml:21-22` defines `hasTask` and `hasWindowTask`.
- `package/contents/ui/TaskContextMenu.qml:291-534` contains many direct `taskModel.request*` calls from individual menu item handlers.

#### Current state

Most task actions rely on `enabled`/`visible` bindings and the initial menu-open check. Individual click handlers directly call task-model mutation methods and do not route through a central validator immediately before dispatch.

#### Design concern

The invariant "only valid model indexes with required task/window capabilities can invoke model mutations" is spread across rendered menu items. If the model index becomes invalid after menu creation, or if a malformed truthy index reaches the menu, dispatch is not centrally protected.

#### Correct end state

Task mutations should go through a small command layer owned by the menu/task action boundary. Each command should re-read live model roles when appropriate, validate model index, check capability, classify the result, and then call the corresponding `TasksModel.request*` method.

#### Suggested migration

Add `TaskCommandLogic.js` or equivalent QML command helpers for `canExecute` and `execute`. Migrate menu items one action group at a time so UI enabled state and dispatch use the same predicate. Tighten `hasValidModelIndex()` only after verifying actual QML persistent-index shape.

#### Acceptance criteria

- Menu item enabled state and clicked dispatch use the same central predicate.
- Direct `taskModel.request*` calls are not scattered across unrelated menu item handlers.
- Tests or QML-level checks cover invalid/stale model indexes and missing capability roles.

#### Priority

P2

## Cohesion, Coupling, and Ownership Problems

### Finding: Model publication is owned by invisible UI delegates in `main.qml`

#### Evidence

- `package/contents/ui/main.qml:22-32` stores normal task registries, manual order, remote-attention registries, remote-attention order, target state, launcher revision, and launcher config update state on the root `PlasmoidItem`.
- `package/contents/ui/main.qml:194-253` mutates `normalTaskEntryMap`, recomposes `normalTaskEntries`, mutates `remoteAttentionEntryMap`, and applies remote-attention snapshots.
- `package/contents/ui/main.qml:352-429` uses an invisible `QtQuick.Repeater` delegate over `tasksModel`; the delegate creates `taskInfo`, evaluates `qualifies`, sets `height: 0`, `visible: false`, `width: 0`, and calls `root.publishNormalTask()` from lifecycle and property-change handlers.
- `package/contents/ui/main.qml:432-478` repeats the same pattern for `attentionTasksModel`.
- `package/contents/ui/main.qml:506-584` renders `root.normalTaskEntries` and `root.remoteAttentionTarget`.

#### Current state

`main.qml` owns Plasma model configuration, role extraction, publication lifecycle, normal task composition, remote-attention composition, launcher persistence, activation, reorder actions, menu lifecycle, and layout. The visible task model is built by side effects from invisible QML delegates.

#### Design concern

The owner of the widget-visible model is hard to locate. Understanding why a task appears requires jumping between `TasksModel`, hidden delegates, root publication functions, pure helper modules, and visible delegates. Lifecycle ordering in `Component.onCompleted`, `Component.onDestruction`, and property-change handlers becomes part of the domain flow.

#### Correct end state

Task observation and composition should have an explicit owner such as `TaskModelController.qml`, `NormalTaskSource.qml`, and/or `RemoteAttentionSource.qml`. That controller should own role extraction, publication keys, entry maps, manual order, remote-attention order, and read-only outputs such as `normalTaskEntries`, `remoteAttentionCount`, and `remoteAttentionTarget`. `main.qml` should bind to those outputs and handle applet-level wiring.

#### Suggested migration

Extract the normal `TasksModel` hidden repeater and `normalTaskEntryMap`/`normalTaskManualOrder` into a non-visual controller while preserving existing `TaskModelLogic.js` calls. Then extract remote attention into the same controller or a sibling controller. Keep rendering unchanged during the move.

#### Acceptance criteria

- `main.qml` no longer contains invisible `QtQuick.Repeater` delegates whose purpose is publishing task entries.
- `main.qml` no longer directly owns `normalTaskEntryMap`, `normalTaskManualOrder`, `remoteAttentionEntryMap`, or `remoteAttentionOrder`.
- The visible `ListView` binds to a named controller/model-adapter API.
- Current pinned ordering, unpinned manual order, and remote-attention target behavior are preserved.

#### Priority

P1

### Finding: Launcher feature boundaries are interwoven across menu, root, task composition, and persistence

#### Evidence

- `package/contents/ui/LauncherListLogic.js:36-59` computes config/model launcher-list updates.
- `package/contents/ui/LauncherListLogic.js:73-201` parses serialized launcher activity prefixes and computes launcher activity updates.
- `package/contents/ui/LauncherListLogic.js:221-339` computes visible launcher positions and pinned-launcher reorder results.
- `package/contents/ui/main.qml:74-99` writes both `tasksModel.launcherList` and `Plasmoid.configuration.launchers`.
- `package/contents/ui/main.qml:102-120` pins and unpins via `tasksModel.requestAddLauncher` and `tasksModel.requestRemoveLauncher`.
- `package/contents/ui/main.qml:151-162` delegates pinned launcher reorder into `LauncherListLogic`.
- `package/contents/ui/main.qml:177-188` computes visible launcher positions using `tasksModel.launcherList`, current activity, and `tasksModel.launcherPosition`.
- `package/contents/ui/TaskModelLogic.js:111-223` folds launcher entries and matching task entries into the normal visible model.
- `package/contents/ui/TaskContextMenu.qml:155-191` computes launcher activity updates and emits full replacement launcher lists.

#### Current state

Launcher behavior spans serialized launcher parsing, activity scope, visible position calculation, normal task composition, drag reorder policy, menu toggles, pin/unpin requests, model writes, and plasmoid configuration persistence.

#### Design concern

Pinned launcher support and launcher activity scoping are hard to modify or remove independently. The menu knows how to build replacement lists, root knows how to persist them, task composition knows how launcher entries consume windows, and drag reorder branches on launcher-backed entries.

#### Correct end state

A launcher controller should be the feature owner. It should expose intent-level operations such as `pinLauncher(url)`, `unpinLauncher(url)`, `setLauncherActivities(url, activities)`, `movePinnedLauncher(source, target)`, and `visiblePosition(url)`. `LauncherListLogic.js` should remain the pure transformation layer, but QML components should not exchange raw replacement launcher lists except inside the controller boundary.

#### Suggested migration

Move `applyLauncherList()`, `persistLaunchers()`, `pinLauncher()`, `unpinLauncher()`, and launcher activity application into one launcher controller. Replace `launcherListChangeRequested(var launchers)` with intent-level signals. Have task composition ask the controller for visible positions rather than directly reading `tasksModel.launcherList` and `tasksModel.launcherPosition`.

#### Acceptance criteria

- Only one owner writes `tasksModel.launcherList` and `Plasmoid.configuration.launchers`.
- `TaskContextMenu.qml` does not compute or emit full replacement launcher lists.
- Launcher activity changes are represented as intent-level operations.
- Pinned launcher reorder policy is testable without root QML.

#### Priority

P1

### Finding: `TaskContextMenu.qml` has broad controller, presenter, and renderer responsibilities

#### Evidence

- `package/contents/ui/TaskContextMenu.qml:6-14` imports QtQuick, Plasma menu/core/plasmoid modules, `org.kde.taskmanager`, and several domain logic modules.
- `package/contents/ui/TaskContextMenu.qml:20-44` defines live task state, desktop entry projection, launcher state, task model references, visual width, and menu placement.
- `package/contents/ui/TaskContextMenu.qml:57-92` reads live `TasksModel` roles through `taskModel.data()`.
- `package/contents/ui/TaskContextMenu.qml:94-116` discovers running activities and launcher activity state.
- `package/contents/ui/TaskContextMenu.qml:122-190` owns task activity checks, task activity mutation, launcher activity checks, launcher activity mutation, and launcher-list replacement calculation.
- `package/contents/ui/TaskContextMenu.qml:203-213` creates its own `TaskManager.ActivityInfo` and `TaskManager.VirtualDesktopInfo`.
- `package/contents/ui/TaskContextMenu.qml:215-535` defines menu items, visibility/enabled/checked rules, submenus, dynamic item factories, and direct `taskModel.request*` actions.
- `package/contents/ui/TaskContextMenuLogic.js:4-18` only contains panel placement logic.

#### Current state

The context menu component is a native menu view, live task-role adapter, workspace data provider, action policy engine, launcher mutation initiator, and command dispatcher.

#### Design concern

The component has low cohesion. Removing or changing activity actions, launcher activity actions, virtual desktop actions, or window-state actions requires editing one large component that also owns unrelated native menu mechanics and live data fetching.

#### Correct end state

`TaskContextMenu.qml` should remain the per-invocation Plasma-native menu shell, but action state should be computed outside rendered `MenuItem` objects. A pure or mostly pure menu action model should return descriptors grouped by feature area: pinning, launcher activities, window commands, virtual desktops, task activities, and close. A controller or dispatcher should own side effects.

#### Suggested migration

Extract role snapshot construction first. Add a pure menu action model builder for one group at a time, starting with window commands. Replace direct bindings with descriptor-driven bindings incrementally. Move `TasksModel.request*` calls into named action dispatchers while preserving action order and labels.

#### Acceptance criteria

- Menu item visibility/enabled/checked state is computed outside rendered `MenuItem` objects.
- Each action group can be removed without editing unrelated action groups.
- Direct task-model requests are centralized.
- Launcher activity actions no longer own launcher-list replacement.

#### Priority

P1

### Finding: Leaf components read global `Plasmoid` state instead of receiving environment context

#### Evidence

- `package/contents/ui/TaskFrame.qml:6-9` imports `org.kde.plasma.plasmoid`.
- `package/contents/ui/TaskFrame.qml:20` defaults `panelLocation` to `Plasmoid.location`.
- `package/contents/ui/TaskContextMenu.qml:9` imports `org.kde.plasma.plasmoid`.
- `package/contents/ui/TaskContextMenu.qml:44` computes menu placement from `Plasmoid.location`.
- `package/contents/ui/main.qml:20-21` already owns top-level applet environment concerns such as drag MIME type and vertical form factor.

#### Current state

Root and leaf UI components both read applet-global state. `TaskFrame.qml` and `TaskContextMenu.qml` infer panel location directly rather than receiving it as input.

#### Design concern

Panel environment ownership is scattered. Leaf components are harder to preview, reuse, or test because they implicitly require applet-global state.

#### Correct end state

The root applet or a clearly named environment provider should own panel location, form factor, and orientation. Components that need environment context should receive explicit properties.

#### Suggested migration

Add an explicit `panelLocation` property to `TaskContextMenu.qml` and pass it from `main.qml`. Pass `panelLocation` into `TaskFrame.qml` through `TaskItem.qml` and `AttentionItem.qml`, or through a shared task-surface component. Remove `org.kde.plasma.plasmoid` imports from leaf components once callers supply context.

#### Acceptance criteria

- `TaskFrame.qml` no longer imports `org.kde.plasma.plasmoid`.
- `TaskContextMenu.qml` does not read `Plasmoid.location` directly.
- The top-level applet or environment provider is the only owner of panel location/form factor state.
- Frame prefix selection and menu placement remain unchanged.

#### Priority

P2

## Logic Placement and Flow Predictability

### Finding: Launcher-position invalidation uses an implicit revision token in UI bindings

#### Evidence

- `package/contents/ui/main.qml:31` defines `launcherRevision`.
- `package/contents/ui/main.qml:177-188` defines `visibleLauncherPosition(launcherUrl, launcherRevisionToken)`. The token is only used to choose a revision value and reject negative values; actual launcher position logic uses `tasksModel.launcherList`, `activityInfo.currentActivity`, and `tasksModel.launcherPosition(url)`.
- `package/contents/ui/main.qml:301-303` increments `launcherRevision` on activity changes.
- `package/contents/ui/main.qml:332-333` increments `launcherRevision` on launcher-list changes.
- `package/contents/ui/main.qml:360` passes `root.launcherRevision` into a delegate property to force reevaluation.

#### Current state

`launcherRevision` is a manual QML binding invalidation counter masquerading as a domain input to `visibleLauncherPosition()`.

#### Design concern

The function signature suggests the revision participates in launcher-position logic, but it is actually a hidden control-flow mechanism. This is surprising and fragile during refactors.

#### Correct end state

Launcher-position invalidation should be encapsulated behind the launcher/task composition owner. Either recomposition should be triggered explicitly on launcher-list and activity changes, or the invalidation token should be private and named as an implementation detail.

#### Suggested migration

Rename the mechanism to `launcherPositionInvalidationRevision` if it remains temporarily. Move `visibleLauncherPosition()` and invalidation into the task composition or launcher controller. Trigger recomposition explicitly from activity and launcher-list change handlers.

#### Acceptance criteria

- Domain-facing helper signatures do not take unused revision tokens.
- Launcher visibility recomputes when current activity or launcher list changes.
- Delegates do not need to know about launcher revision counters.

#### Priority

P2

### Finding: Drag reorder flow crosses UI event handling, root branching, and helper policies

#### Evidence

- `package/contents/ui/TaskItem.qml:129-142` creates drag MIME data using `root.taskIndex`.
- `package/contents/ui/TaskItem.qml:144-180` parses dropped MIME data, checks drop acceptance through `root.canDropTask(...)`, manages hover state, and emits `taskDropped(...)`.
- `package/contents/ui/main.qml:539-555` wires delegate drag callbacks to `root.canMoveTask(...)` and `root.moveTask(...)`.
- `package/contents/ui/main.qml:122-166` translates source/target indexes to entries and branches between `moveManualTask(...)` and `movePinnedLauncher(...)`.
- `package/contents/ui/TaskModelLogic.js:265-290` contains cross-boundary move policy.
- `package/contents/ui/LauncherListLogic.js:272-339` contains pinned-launcher move policy and launcher-list rewriting.

#### Current state

The visual item owns MIME parsing and hover acceptance, root owns command branching, and helper modules own policy details. The drag payload is a numeric task index/move index rather than a stable domain identity.

#### Design concern

The reorder flow is hard to read end to end. The visual item needs knowledge of task index semantics, while root reconstructs domain entries and then delegates to different helper modules.

#### Correct end state

Drag UI should collect source and target tokens and ask a reorder controller whether the drop is allowed and how to apply it. The controller should own decoding, entry lookup, cross-boundary policy, manual-order updates, and pinned-launcher list updates. Visual delegates should not need to know whether a token represents a source index, move index, pinned slot, or unpinned task.

#### Suggested migration

Introduce a reorder command helper that accepts source/target identifiers and returns `canDrop` or `apply` results. Keep the existing MIME type initially, but treat its payload as opaque outside the controller. Move source/target entry lookup out of root.

#### Acceptance criteria

- `TaskItem.qml` does not implement task-specific acceptance rules beyond asking a supplied controller/callback.
- Root no longer branches directly between manual-task and pinned-launcher moves.
- Reorder policy is testable without QML drag events.
- Cross-boundary drops remain rejected.

#### Priority

P2

### Finding: Final-item shortcut behavior is reconstructed outside the composed visible model

#### Evidence

- `docs/spec/SPEC.md:79-88` defines `Meta+0` as activating the final item in visible item order.
- `package/contents/ui/main.qml:42-64` implements `activateTaskAtIndex(index)` with special handling for `index === 9`.
- `package/contents/ui/main.qml:506-559` renders normal tasks from `root.normalTaskEntries`.
- `package/contents/ui/main.qml:562-584` renders `AttentionItem` after the normal `ListView`.
- `package/contents/ui/main.qml:256-262` activates remote attention through `attentionTasksModel.requestActivate(...)`, while normal tasks use `tasksModel.requestActivate(...)`.

#### Current state

The UI layout places remote attention after the normal list, but shortcut logic manually reconstructs "final visible item" rather than asking a composed model for shortcut targets.

#### Design concern

The final-item rule is split between layout order and activation code. Any future change to visible item composition must update both.

#### Correct end state

The task composition controller or `SlotPolicyLogic.js` should expose shortcut targets explicitly, including `Meta+0`. Rendering can keep normal tasks and remote attention in separate visual sections, but activation should dispatch based on a target object with source model and model index.

#### Suggested migration

Add a pure helper that derives shortcut targets from `normalTaskEntries` and optional `remoteAttentionTarget`. Use it from `activateTaskAtIndex()` before moving it into the task composition controller.

#### Acceptance criteria

- `activateTaskAtIndex()` no longer contains direct `index === 9` final-item branching.
- A tested helper returns activation targets for slots `1` through `9` and `Meta+0`.
- Remote attention remains the `Meta+0` target when present.
- `Meta+0` still activates the final normal task when no remote-attention item exists.

#### Priority

P2

## Testability Problems

### Finding: Root orchestration is only directly testable inside Plasma/QML

#### Evidence

- `package/contents/ui/main.qml:42-63` combines shortcut target selection with `tasksModel.requestActivate`.
- `package/contents/ui/main.qml:74-118` combines launcher persistence decisions with writes to `Plasmoid.configuration.launchers`, `tasksModel.launcherList`, `requestAddLauncher`, and `requestRemoveLauncher`.
- `package/contents/ui/main.qml:122-187` combines drag/reorder decisions with live `tasksModel.launcherList`, `tasksModel.launcherPosition(...)`, and `activityInfo.currentActivity`.
- `package/contents/ui/main.qml:194-253` stores and mutates normal and remote publication maps and snapshots directly on the root.
- `tests/qml-js-module.mjs:22-41` loads standalone QML JavaScript helper files in a Node VM; it does not instantiate `main.qml`.

#### Current state

Pure helper modules have good Node-test coverage, but root-level orchestration is embedded in `main.qml` alongside live Plasma objects and QML lifecycle behavior.

#### Design concern

Regressions in `Meta+0` target selection, launcher write ordering, feedback-loop suppression, publication/removal timing, or root command classification cannot be directly tested by the current pure helper test harness.

#### Correct end state

Root policy should move into pure reducer/command-planning modules where possible. QML should adapt live Plasma objects to plain snapshots and execute explicit commands returned by those modules.

#### Suggested migration

Extract activation target selection first, then launcher write planning, then publication-map state transitions. Keep `TaskManager.TasksModel` objects in QML as adapters.

#### Acceptance criteria

- Unit tests verify `Meta+0` with and without remote attention without instantiating `main.qml`.
- Unit tests verify launcher config/model write plans without `Plasmoid.configuration` or `TaskManager.TasksModel`.
- Unit tests verify normal and remote publication state transitions with plain objects.

#### Priority

P1

### Finding: Structural QML source tests substitute for behavior tests in several places

#### Evidence

- `tests/taskvisuallogic.test.mjs:92-142` reads QML files and uses regexes for `KSvg.FrameSvgItem`, `Plasmoid.constraintHints`, layout properties, orientation, spacing, `TaskFrame`, `visualHighlighted`, and absence of `QtQuick.Rectangle`.
- `tests/taskitempresentationlogic.test.mjs:81-111` reads `NumberBadge.qml`, `TaskItem.qml`, and `main.qml` and checks regexes for width/height bindings, imports, helper usage, z-order, and `showTitle`.
- `tests/taskcontextmenulogic.test.mjs:65-117` parses `TaskContextMenu.qml` text to detect direct non-`MenuItem` content.

#### Current state

The suite has strong pure JavaScript tests, but several QML-level expectations are asserted by textual regex or lightweight parsing. These tests verify that strings and structures exist, not that bindings and interactions behave correctly.

#### Design concern

Text-level behavior tests can fail on harmless restructuring and pass despite behavioral regressions. They are especially brittle where the underlying behavior remains in QML.

#### Correct end state

Behavioral rules should be extracted into pure helpers and tested directly, or covered by a minimal QML runtime test where extraction is not practical. Text-level tests should remain only for static structure constraints that are genuinely textual, such as direct menu content restrictions.

#### Suggested migration

Keep current regex tests as temporary characterization tests. For each regex that encodes a behavior rule, extract the behavior into a pure helper or cover it with a QML runtime test. Retain the direct menu content parser only if it remains the best way to enforce that structural constraint.

#### Acceptance criteria

- Behavior tests do not depend on whitespace, object ordering, or exact QML source text.
- Remaining source-text tests are explicitly limited to structural constraints.
- Hover/focus/menu-open highlight behavior has either pure tests or QML runtime tests.

#### Priority

P2

## Error Handling and Observability Problems

### Finding: User actions collapse into silent no-op outcomes

#### Evidence

- `package/contents/ui/main.qml:42-64` returns silently for empty task list, out-of-range target, missing task, or invalid model index in `activateTaskAtIndex()`.
- `package/contents/ui/main.qml:66-72` returns silently for invalid `activateTaskEntry()` input.
- `package/contents/ui/main.qml:102-119` only persists pin/unpin when `tasksModel.requestAddLauncher()` or `requestRemoveLauncher()` returns truthy; false results are ignored.
- `package/contents/ui/main.qml:122-157` returns `false` for disallowed moves or helper failures.
- `package/contents/ui/TaskItem.qml:174-179` accepts drops only if `root.moveTask(...)` returns true; otherwise nothing is reported.
- `package/contents/ui/TaskModelLogic.js:229-254` represents failed lookups and moves as `null` or `{ moved: false }`.
- `package/contents/ui/LauncherListLogic.js:172-200` and `package/contents/ui/LauncherListLogic.js:295-339` represent invalid launcher activity updates or failed pinned moves as `null` or `{ moved: false }`.

#### Current state

Expected ignored actions, stale model state, backend rejections, invalid internal state, and disallowed user actions all use `false`, `null`, empty string, or silent `return`.

#### Design concern

A report like "pin did nothing" or "drag did nothing" cannot be diagnosed from program state. Tests can assert that an operation returned `false`, but not why.

#### Correct end state

Root-level user commands and domain helpers should return typed operation results such as `applied`, `unchanged`, `ignored`, `rejected`, or `failed`, with reason codes such as `missingLauncherUrl`, `crossBoundaryDrop`, `invalidModelIndex`, `backendRejected`, or `stateMismatch`. Expected ignored cases should stay quiet; unexpected rejected/failed cases should be logged with enough context to debug.

#### Suggested migration

Add reason fields to existing helper return values while preserving current boolean behavior for callers. Centralize activation, pin/unpin, launcher moves, and context-menu actions behind wrappers that classify and optionally log unexpected outcomes.

#### Acceptance criteria

- Every root-level user command has a typed outcome and reason.
- Intentional cases such as empty `Meta+0` target and cross-boundary drag are classified as expected ignored outcomes.
- Backend-rejected pin/unpin, stale model indices after visible user actions, and internal state mismatches are classified separately.
- Tests assert reason codes.

#### Priority

P1

### Finding: Launcher persistence guard lacks failure cleanup and diagnostics

#### Evidence

- `package/contents/ui/main.qml:32` declares `updatingLauncherConfig`.
- `package/contents/ui/main.qml:74-83` sets `updatingLauncherConfig = true`, writes `Plasmoid.configuration.launchers`, then sets the flag false.
- `package/contents/ui/main.qml:85-100` sets the guard, writes `tasksModel.launcherList` and/or `Plasmoid.configuration.launchers`, then clears the guard.
- `package/contents/ui/main.qml:332-337` skips persistence while `root.updatingLauncherConfig` is true.

#### Current state

Launcher writes are optimistic and have no `try/finally` cleanup around the guard flag. There is no structured diagnostic if a write fails, if a request returns false, or if model and configuration diverge.

#### Design concern

Pinned launcher persistence is core behavior. If an exception occurs between setting and clearing the guard, future launcher-list changes can stop syncing because `onLauncherListChanged` will keep treating updates as internally initiated.

#### Correct end state

Launcher-list persistence should be a single owned write boundary with `try/finally` around the update guard. It should return typed outcomes such as `applied`, `unchanged`, `backendRejected`, `modelWriteFailed`, `configWriteFailed`, or `diverged`, and log unexpected failures with before/after launcher-list context.

#### Suggested migration

First wrap existing guard usage in `try/finally`. Then change `persistLaunchers()` and `applyLauncherList()` to return structured outcomes. Route pin, unpin, launcher activity, and pinned reorder through that shared writer.

#### Acceptance criteria

- `updatingLauncherConfig` is reset even if a launcher model or config write throws.
- Pin, unpin, reorder, and launcher activity writes expose a concrete reason when no change is applied.
- Model/config divergence after a write is detectable and logged.

#### Priority

P1

### Finding: Dynamic context menu creation failures are silent

#### Evidence

- `package/contents/ui/main.qml:264-268` returns silently for invalid context-menu requests.
- `package/contents/ui/main.qml:271-280` calls `contextMenuComponent.createObject(...)` and returns silently if creation returns `null`.
- `package/contents/ui/main.qml:283-295` sets `visualParent.contextMenuOpen` before `menu.show()`.
- `package/contents/ui/TaskContextMenu.qml:51-55` calls `refreshActivities()`, `refreshLauncherActivities()`, and `openRelative()` without a failure boundary.

#### Current state

If the menu component cannot be created, the function exits with no diagnostic. The code does not inspect `contextMenuComponent.status` or `contextMenuComponent.errorString()`. If showing the menu fails after `contextMenuOpen` is set, there is no explicit cleanup path.

#### Design concern

The context menu is a major user-facing control surface. A QML import issue, type mismatch, or component construction failure can make right-click/menu-key behavior disappear without local diagnostic context.

#### Correct end state

Menu creation should be a small lifecycle boundary. Creation failure should be classified as an internal failure and logged with `Component.errorString()` plus request context. Invalid/stale requests should be ignored with a typed reason. Any lifecycle state such as `contextMenuOpen` should be reset on failure.

#### Suggested migration

Extract menu creation into a helper that returns a typed result. On `null` creation, log component status and error string. Set `contextMenuOpen` only after successful creation/show, or reset it in a failure path.

#### Acceptance criteria

- A deliberately broken `TaskContextMenu.qml` import or required property produces a clear diagnostic containing the component error.
- Invalid menu requests return an ignored reason and do not mutate `contextMenuOpen`.
- If menu showing fails after creation, `contextMenuOpen` is reset and any created menu is destroyed.

#### Priority

P2

### Finding: Unchecked `Qt.include` dependencies fail late

#### Evidence

- `package/contents/ui/LauncherListLogic.js:4` calls `Qt.include("ActivityScopeLogic.js")` and then uses `ActivityScopeLogic`.
- `package/contents/ui/TaskActivityLogic.js:4` calls `Qt.include("ActivityScopeLogic.js")` and then uses `ActivityScopeLogic`.
- `package/contents/ui/TaskItemPresentationLogic.js:4` calls `Qt.include("TaskMetricsLogic.js")` and then calls `iconExtentForTaskFrame`.
- `tests/qml-js-module.mjs:9-13` models `Qt.include` as returning a status object, but production modules do not inspect include status.

#### Current state

Local script dependencies are loaded as side effects. Include results are ignored, so dependency load problems become later unstructured runtime failures such as undefined symbols.

#### Design concern

These includes are fatal dependencies. A missing or broken dependency should identify the failed include directly rather than failing later during unrelated task logic.

#### Correct end state

Required script includes should be checked immediately, or the dependency mechanism should avoid unchecked global side effects. A failed include should produce a clear fatal initialization error naming the dependency.

#### Suggested migration

Add a small include helper or inline status checks next to each `Qt.include`. Update tests to simulate include failure and assert a named initialization error.

#### Acceptance criteria

- Breaking `ActivityScopeLogic.js` or `TaskMetricsLogic.js` causes a deterministic named initialization failure.
- Include failures do not continue into later undefined-symbol errors.

#### Priority

P2

## Deletion, Modularity, and Abstraction Problems

### Finding: Root widget is the integration point for too many removable features

#### Evidence

- `package/contents/ui/main.qml:22-32` owns normal task state, remote-attention state, launcher invalidation state, and launcher persistence guard state.
- `package/contents/ui/main.qml:42-64` owns shortcut activation policy, including `Meta+0` and remote attention.
- `package/contents/ui/main.qml:74-120` owns launcher persistence and pin/unpin effects.
- `package/contents/ui/main.qml:122-166` owns drag reorder branching between manual task movement and pinned launcher movement.
- `package/contents/ui/main.qml:264-295` owns context-menu creation and signal wiring.
- `package/contents/ui/main.qml:316-478` creates both task models and hidden delegate publishers.
- `package/contents/ui/main.qml:481-586` owns visible layout for normal tasks and the remote-attention item.

#### Current state

`main.qml` is the applet shell and the owner of task-model observation, composition state, launcher persistence, reorder orchestration, shortcut activation, menu creation, remote-attention selection, and layout.

#### Design concern

Features are hard to remove cleanly because their paths are woven through the root component. Removing remote attention would touch state properties, activation logic, the second `TasksModel`, hidden publication, layout, and context-menu dispatch. Removing pinned launchers would touch persistence, reorder branching, task composition, visible position invalidation, and menu wiring.

#### Correct end state

`main.qml` should create high-level controllers/adapters and bind their outputs to layout components. Feature ownership should move behind explicit boundaries: task composition controller, launcher controller, remote-attention controller, menu/action controller, and applet environment provider.

#### Suggested migration

Extract hidden normal-task publication first, remote attention second, and launcher persistence third. Replace root-level feature functions with intent-style controller calls while keeping rendering stable.

#### Acceptance criteria

- `main.qml` no longer contains task publication maps or hidden `Repeater` delegates.
- Removing remote attention does not require editing normal task composition, launcher persistence, or drag reorder code.
- Removing pinned launcher support does not require editing context-menu rendering or remote-attention logic.
- Root-level functions are limited to applet wiring and dispatching controller intents.

#### Priority

P1

### Finding: Normal task and attention delegates duplicate task-like interaction and frame structure

#### Evidence

- `package/contents/ui/TaskItem.qml:32-43` computes frame padding, presentation state, and `visualHighlighted`.
- `package/contents/ui/AttentionItem.qml:23-25` computes frame padding, icon extent, and `visualHighlighted`.
- `package/contents/ui/TaskItem.qml:56-66` and `package/contents/ui/AttentionItem.qml:37-43` both render `TaskFrame`.
- `package/contents/ui/TaskItem.qml:190-228` and `package/contents/ui/AttentionItem.qml:92-130` both implement keyboard menu handling, hover handling, right-click handling, left-click activation, zero-interval menu timer, focus, and context-menu request payload.
- `package/contents/ui/main.qml:283-289` checks `visualParent.contextMenuOpen !== undefined` and mutates that delegate property while the menu is open.

#### Current state

`TaskItem.qml` and `AttentionItem.qml` are separate components with overlapping task-like interaction, frame, highlight, pointer, focus, context-menu, and row layout mechanics. Root uses a duck-typed `contextMenuOpen` property convention.

#### Design concern

Shared task-like behavior must be kept synchronized manually. Adding another task-like item or changing menu lifecycle behavior risks inconsistent highlight or focus behavior.

#### Correct end state

A shared task-like surface component or interaction helper should own hover/focus/menu-open highlighted state, keyboard and pointer context-menu requests, focus assignment before opening a menu, left-click activation signal, and common `TaskFrame` shell. Specialized components should add slot numbering, drag/drop, or attention count behavior.

#### Suggested migration

Extract context-menu request/focus payload construction first. Replace root's `contextMenuOpen !== undefined` branch with an explicit property, method, or signal on the shared surface. Then consider extracting common frame/highlight wiring.

#### Acceptance criteria

- Context-menu request construction is not duplicated between `TaskItem.qml` and `AttentionItem.qml`.
- `main.qml` no longer uses `contextMenuOpen !== undefined` to discover delegate capabilities.
- Normal and remote-attention highlighting stay consistent while a context menu is open.
- Existing activation and keyboard menu behavior are preserved.

#### Priority

P2

### Finding: `TaskEntryLogic.js` combines unrelated primitive responsibilities

#### Evidence

- `package/contents/ui/TaskEntryLogic.js:4-18` normalizes virtual desktop identifiers.
- `package/contents/ui/TaskEntryLogic.js:20-53` implements virtual desktop membership and remote desktop checks.
- `package/contents/ui/TaskEntryLogic.js:55-58` checks model-index validity.
- `package/contents/ui/TaskEntryLogic.js:61-84` contains generic coercion and title/icon fallback helpers.
- `package/contents/ui/TaskEntryLogic.js:86-102` builds base task entry snapshots.
- `package/contents/ui/TaskModelLogic.js:4-52` and `package/contents/ui/RemoteAttentionLogic.js:4-13` depend on it for task snapshot construction.
- `package/contents/ui/TaskContextMenu.qml:21` uses `TaskEntryLogic.hasValidModelIndex`, and `package/contents/ui/TaskContextMenu.qml:443` uses `TaskEntryLogic.desktopListContains`.

#### Current state

`TaskEntryLogic.js` is a broad utility module for virtual desktop semantics, model-index validity, role coercion, fallback formatting, and base task snapshot construction.

#### Design concern

The module name suggests task entry construction, but consumers import it for unrelated primitives. Changing virtual desktop semantics, model-index validity, or task snapshot shape all involve the same module.

#### Correct end state

Split the public surface by responsibility. A virtual desktop helper should own `desktopId`, `desktopListContains`, `isOnCurrentVirtualDesktop`, and `isRemoteVirtualDesktop`. A task snapshot/projection helper should own role coercion, title/icon fallback, and base entry construction. Model-index validity should belong to a QML adapter helper or command-dispatch boundary.

#### Suggested migration

Introduce narrowly named helpers and move consumers one at a time. Keep `TaskEntryLogic.js` as a temporary facade while tests are updated, then remove facade exports once unused.

#### Acceptance criteria

- Context-menu code does not import a broad task-entry module just for desktop membership or model-index validity.
- Normal and remote task composition share a task snapshot builder without also inheriting desktop and model-index utilities.
- Virtual desktop membership rules have one narrow owner.

#### Priority

P2

## Recommended Correct End-State Architecture

`main.qml` should be a thin applet composition shell. It should own applet-level concerns: creating or wiring controller components, passing panel environment context, binding controller outputs to layout, and invoking external effects that truly must live at the root.

`TaskModelController.qml` or equivalent should own model observation and composition. It should contain the QML-specific hidden `Repeater` mechanism if that mechanism is still needed, but expose a named API: `normalTaskEntries`, `remoteAttentionCount`, `remoteAttentionTarget`, `shortcutTargets`, `canReorder(source, target)`, and `requestReorder(source, target)`. Pure ordering, filtering, and publication transitions should remain in tested JS modules.

`LauncherController.qml` should own launcher feature effects. It should be the only owner that writes `tasksModel.launcherList` and `Plasmoid.configuration.launchers`, the only owner of config/model feedback-loop suppression, and the only owner of intent-level launcher operations. `LauncherListLogic.js` should remain the pure transformation layer for serialized launcher strings and activity prefixes.

`RemoteAttentionController.qml` can be a sibling controller or part of the task model controller, but it should own the second `TasksModel`, remote qualification, stable identity, attention order, count, and selected target. Its public API should not expose row/title fallback identity as a stable key unless KDE model evidence proves that fallback is correct.

`SlotPolicyLogic.js` should own shortcut and numbering policy. It should define numbered slot count, final shortcut index, slot label derivation, and activation target derivation for `Meta+1` through `Meta+0`.

`TaskRoleProjectionLogic.js` or a tightened `TaskEntryLogic.js` should own task role projection and required/optional role semantics. It should define fallback icons and field coercion once, and should support diagnostics for missing or malformed required roles without making optional roles noisy.

`ActivityScopeLogic.js` should be the only public owner of generic activity scope. `TaskActivityLogic.js` should express task mutation policy, and `LauncherListLogic.js` should express launcher serialization and launcher mutation policy.

`TaskContextMenu.qml` should remain the Plasma-native menu shell. A menu model/controller should own role snapshot construction, action descriptor generation, and dispatch. Action groups should be separable: pinning, launcher activities, window commands, virtual desktops, task activities, and close.

External effects should be isolated at command boundaries. Calls to `TasksModel.request*`, assignments to `tasksModel.launcherList`, assignments to `Plasmoid.configuration.launchers`, menu creation, and QML focus/timer behavior should be thin adapters around pure decisions.

Errors should be represented as typed outcomes at user-command boundaries. Expected ignored outcomes should be silent; unexpected rejected or failed outcomes should carry reason codes and enough context for diagnostics.

Tests should follow the same boundaries. Pure helper/reducer tests should cover slot policy, task projection, launcher identity, activity mutation, model publication transitions, shortcut targets, and command outcomes. QML runtime tests should be reserved for binding and signal integration that cannot be extracted. Source-text tests should be limited to static structural constraints.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior, especially `Meta+0`, task activity last-toggle behavior, duplicate launcher inputs, empty/duplicate `entryKey`, remote-attention fallback identity, launcher write outcomes, and context-menu action state.
2. Centralize duplicated rules and state by introducing `SlotPolicyLogic.js`, tightening `ActivityScopeLogic.js` ownership, defining task role projection constants, and choosing a launcher identity policy.
3. Isolate core domain logic from external effects by extracting activation target selection, publication-map transitions, launcher write planning, and reorder decisions into pure modules or controller methods with explicit command results.
4. Clarify ownership boundaries by moving hidden task publication out of `main.qml`, introducing a launcher controller, and moving menu action state out of rendered `MenuItem` bindings.
5. Improve error semantics and observability by adding typed operation outcomes, `try/finally` around launcher persistence guard handling, context-menu creation diagnostics, role projection diagnostics, and checked `Qt.include` dependencies.
6. Remove or simplify premature and broad abstractions by narrowing `TaskEntryLogic.js`, removing generic activity wrapper re-exports, replacing duplicated task-like delegate interaction with a shared surface/helper, and reducing QML regex tests to static structure checks.

## Things Not To Change Yet

- Do not replace KDE Plasma's `org.kde.taskmanager` model or `TasksModel.request*` APIs; the current architecture intentionally builds on public Plasma APIs.
- Do not rewrite the widget in a different UI framework or introduce a large state-management framework; the correct direction is smaller ownership boundaries around the existing QML/JS design.
- Do not change the serialized launcher format until launcher identity policy is chosen and characterized; keep current behavior stable during controller extraction.
- Do not remove the remote-attention fallback key until KDE `TasksModel` behavior for missing `WinIdList` is verified.
- Do not add a settings UI, migration layer, grouped tasks, or full KDE task-manager parity as part of this design cleanup.
- Do not optimize the Nix/CI check split before correctness and ownership boundaries; it is useful maintenance but not the central design risk in the current program.

## Appendix: Subagent Reports

### Single Source of Truth / Duplication Agent

Accepted and merged: slot/shortcut policy split, task role projection ownership, activity-scope wrapper re-exports, and shared `TasksModel` configuration duplication. The slot finding was merged with final-item activation flow. The role projection finding was merged with error/diagnostic concerns around task role fallbacks. The model configuration finding remains P2 because it is a drift risk, not an immediate correctness issue.

### Invariant / Correctness Agent

Accepted: task activity last-toggle behavior, launcher URL-only identity, unenforced `entryKey` uniqueness, and task command validation concerns. Accepted as uncertain: remote-attention fallback identity, because the code evidence is clear but the correct fix depends on KDE `TasksModel` guarantees about `WinIdList`. Merged: task action validity was folded into context-menu action ownership and command-result findings.

### Cohesion / Coupling / Ownership Agent

Accepted and merged: model publication through invisible delegates, broad `TaskContextMenu.qml` responsibilities, leaf component `Plasmoid` reads, duplicated task-like delegate interaction, and activity-scope API blur. The model-publication finding is one of the top architecture risks. The leaf environment and delegate duplication findings are P2 because they mainly affect maintainability and reuse.

### Logic Placement / Flow Readability Agent

Accepted and merged: hidden delegate publishers, launcher mutation split across menu/root/model/config, final-item shortcut reconstruction, launcher revision invalidation, and drag reorder flow. The launcher mutation finding was merged into the launcher-controller ownership finding. The final-item finding was merged with slot policy.

### Testability Agent

Accepted and merged: root orchestration requires Plasma/QML to verify, context-menu policy is embedded in live QML, delegate interaction depends on QML event timing, and structural QML tests substitute for behavior tests. Rejected as a main design finding: splitting the monolithic Nix check, because it is useful repository maintenance but less central to the program's architectural end state than the QML/domain ownership boundaries.

### Error Handling / Observability Agent

Accepted and merged: silent no-op outcomes, context-menu creation failure silence, launcher persistence guard cleanup, role fallback diagnostics, and unchecked `Qt.include` dependencies. These findings were consolidated under typed command outcomes, launcher write boundary, menu lifecycle diagnostics, role projection diagnostics, and include initialization checks.

### Deletion / Modularity / Abstraction Agent

Accepted and merged: root widget as integration point for too many removable features, launcher feature interweaving, monolithic context menu, activity wrapper duplication, normal/attention delegate duplication, and broad `TaskEntryLogic.js`. These findings reinforced the recommended controller boundaries and the "things not to change yet" list.
