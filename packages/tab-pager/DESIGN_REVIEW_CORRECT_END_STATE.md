<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

# Design Review: Correct End State

## Executive Summary

`tab-pager` is already small, readable, and substantially tested. The main architectural risk is not uncontrolled size; it is that several correctness-sensitive policies are implicit and split across boundaries that will become harder to change: raw desktop source normalization, current-desktop invariants, model/controller ownership, wheel input semantics, and runtime diagnostics.

The correct end state should keep the existing behavior unless characterization tests prove a current behavior is a bug, but it should make the ownership boundaries sharper. Raw KDE/LibTaskManager data should be normalized once at the source boundary. The Qt list model should present already-normalized row state and own Qt model roles/signals only. Command handling, navigation, source synchronization, and logging should move into a controller/facade layer. QML should split the production Plasma shell from an injectable view component so user-facing wiring can be tested without the real desktop source.

## Top Design Risks

1. **P1: Normal desktop state invariants are not centrally protected.** `TabPagerDesktopSnapshot` can represent duplicate desktop IDs, zero matching current desktops, or multiple active rows, while `TabPagerDesktopRows` later collapses or filters those states opportunistically.
2. **P1: `TabPagerBackend` is both model and controller.** It subclasses `TabPagerDesktopModel`, owns the source and navigator, synchronizes source state, exposes commands, and is used by QML as model, font provider, and command target.
3. **P1: The QML composition is not injectable.** `main.qml` constructs the production `TabPagerBackend`, which constructs `TaskManagerDesktopSource`, so click/wheel/form-factor wiring is hard to test without the Plasma runtime and real KDE source.
4. **P2: Wheel navigation has split semantics and unclear accumulator lifecycle.** QML owns axis/inversion mapping, C++ owns accumulation and direction mapping, and pending wheel deltas survive source-state changes without an explicit invariant.
5. **P2: Failure and anomaly paths collapse into silent no-ops.** Invalid activation, missing current desktop, malformed source snapshots, and normal edge stops are all represented as `return`, `std::nullopt`, `-1`, or filtered rows without project-owned diagnostics.

## Single Source of Truth Violations

### Finding: Raw desktop source normalization has no single owner

**Evidence:** `src/taskmanagerdesktopsource.cpp:37-59` builds `TabPagerDesktopSourceState` directly from raw IDs, names, current desktop, and wrapping; `src/taskmanagerdesktopsource.cpp:44-48` uses `names.value(index)` so missing names become empty strings; `src/tabpagerdesktoprows.cpp:31-39` filters invalid desktop IDs later; `tests/tabpagerdesktoprows_test.cpp:45-59` and `tests/tabpagerdesktopmodelstate_test.cpp:81-91` encode invalid-ID filtering in row/model-state tests.

**Current state:** The source adapter partly normalizes raw data by zipping IDs with names, while row projection later filters invalid IDs and derives active rows. Missing names, invalid IDs, and unmatched current desktop are not handled by one documented policy.

**Design concern:** Bad upstream data can become normal-looking UI state, and future changes can implement mismatched ID/name or invalid-current behavior inconsistently across the adapter, ID type, row projection, activation guard, and tests.

**Correct end state:** `TaskManagerDesktopSource` or a source-normalization module should be the only owner of raw KDE data normalization. It should validate desktop IDs, define the missing/extra-name policy, detect duplicate IDs and unmatched current desktop, and produce a normalized desktop state plus structured anomaly information. The row/model layer should receive valid entries only and should not filter invalid IDs as normal operation.

**Suggested migration:** Add characterization tests for shorter `desktopNames`, longer `desktopNames`, invalid IDs, duplicate IDs, and unmatched current desktop. Extract a pure mapper from `TaskManagerDesktopSource::sourceState()`. Move invalid-ID filtering and source anomaly classification into that mapper, then update row/model tests to consume normalized state.

**Acceptance criteria:** One documented code path converts raw `TabPagerVirtualDesktopInfo` data into normalized desktop state. Row projection no longer filters invalid IDs during normal operation. Missing/extra names and invalid current desktop have explicit tests and diagnostics. Current visible behavior is preserved unless a characterization test identifies a bug.

**Priority:** P1.

### Finding: Virtual desktop invalidation signals are enumerated twice

**Evidence:** `src/tabpagervirtualdesktopinfo.cpp:32-44` forwards five LibTaskManager signals to `TabPagerVirtualDesktopInfo` signals; `src/taskmanagerdesktopsource.cpp:21-32` repeats the same five-signal list and maps them to `TabPagerDesktopSource::sourceStateChanged()`; `tests/taskmanagerdesktopsource_test.cpp:133-145` verifies five source-change emissions.

**Current state:** Both the low-level wrapper and the source adapter define which upstream changes invalidate source state.

**Design concern:** Adding a new source-affecting field or signal requires remembering to update two adapter layers. One can drift while tests still cover only the existing list.

**Correct end state:** Only one production layer should enumerate raw LibTaskManager invalidation signals. Prefer a single aggregate `stateChanged` signal from `TabPagerVirtualDesktopInfo`, with `TaskManagerDesktopSource` connecting only that aggregate to `sourceStateChanged()`.

**Suggested migration:** Add an aggregate signal, emit it from each existing low-level signal connection, connect only that aggregate in `TaskManagerDesktopSource`, then remove per-field signals if no caller needs them.

**Acceptance criteria:** The five LibTaskManager signal names appear in only one production adapter. `TaskManagerDesktopSource` no longer knows the full raw invalidation list. Existing tests still prove each upstream change triggers source reload.

**Priority:** P2.

### Finding: Package and module identity are repeated across build and packaging

**Evidence:** `CMakeLists.txt:6-10` defines project/version/module/plasmoid IDs; `CMakeLists.txt:136-145` installs using those IDs; `package/metadata.json:13-16`, `src/qmldir:1`, `package/contents/ui/main.qml:11`, `nix/module/package.nix:10-11`, `nix/lib/tab-pager-ci.nix:116-117`, and `README.md:15` repeat `io.github.hnjae.tabpager` or `0.1.0`.

**Current state:** The install identity and version are manually synchronized across CMake, metadata, QML, Nix, CI, and README.

**Design concern:** Identity drift can break installation or QML imports without touching application logic.

**Correct end state:** CMake should own `PROJECT_VERSION`, `QML_MODULE_URI`, `QML_MODULE_DIR`, and `PLASMOID_ID`, with generated or verified `metadata.json` and `qmldir`. Nix and CI should derive or check the same values rather than hard-coding independent paths.

**Suggested migration:** Add `metadata.json.in` and `qmldir.in`, generate installed metadata from CMake variables, derive the QML module path in Nix or add a check comparing CMake, metadata, and Nix values.

**Acceptance criteria:** `io.github.hnjae.tabpager` and `0.1.0` have one authoritative source each for build/package metadata. CI fails on mismatches. Changing the ID or version requires one production edit plus generated/check updates.

**Priority:** P2.

### Finding: QML layout constants have competing defaults

**Evidence:** `package/contents/ui/PagerLayoutMetrics.qml:13` defines `desktopGap: 1`; `package/contents/ui/PagerDesktopStrip.qml:13` also defaults `desktopGap` to `1`; `PagerLayoutMetrics.qml:20-27` clamps content extents to at least `1`; `PagerDesktopStrip.qml:21-22` also clamps implicit extents to at least `1`; `tests/tabpagerlayoutmetrics_test.cpp:31` tests the metrics value only.

**Current state:** The one-pixel KDE pager gap and minimum-size behavior are represented in both metrics and strip components.

**Design concern:** Layout constants can drift if one component is changed and the other is not.

**Correct end state:** `PagerLayoutMetrics` or a single layout coordinator should own panel layout constants. `PagerDesktopStrip` should require the gap from its caller or clearly mark its fallback as defensive component safety, not policy.

**Suggested migration:** Make `desktopGap` required on `PagerDesktopStrip`, or rename/default it as a neutral fallback. Keep minimum extent policy in one tested owner.

**Acceptance criteria:** The one-pixel gap has one authoritative production definition. Tests assert it through that owner. Changing the gap requires one production edit.

**Priority:** P3.

## Invariant and Correctness Risks

### Finding: Active desktop cardinality is not centrally protected

**Evidence:** `src/tabpagerdesktop.h:16-19` defines `TabPagerDesktopSnapshot` as bare `desktops` plus `currentDesktop`; `src/tabpagerdesktoprows.cpp:13-23` marks each row active independently; `src/tabpagerdesktoprows.cpp:44-52` returns the first active row or `-1`; `tests/tabpagerdesktopmodelstate_test.cpp:152-163` treats changes between two unmatched current desktop IDs as `Unchanged`; `docs/spec/SPEC.md:27` says the current virtual desktop is highlighted.

**Current state:** A snapshot can represent zero matching current desktops, one matching current desktop, or multiple active rows if duplicate IDs exist. `currentIndex()` collapses multiple active rows to the first active row while row data can still contain multiple `active == true` values.

**Design concern:** The model can expose contradictory state: multiple highlighted rows with one `currentIndex`, or desktops with no active row. Navigation and visual behavior then depend on downstream interpretation rather than a central invariant.

**Correct end state:** Introduce a normalized desktop state type, for example `TabPagerDesktopState`, that owns the invariant that normal non-empty state has unique desktop IDs and exactly one current desktop. If upstream data violates this, the source boundary should produce an explicit degraded state or deterministic normalization outcome before the model sees it. `active` and `currentIndex` should be derived once from normalized state.

**Suggested migration:** Add characterization tests for duplicate desktop IDs and unmatched current desktop IDs. Introduce normalized state alongside `TabPagerDesktopSnapshot`, migrate `TabPagerDesktopModelState::fromSnapshot()` to consume normalized state, then revise unmatched-current tests to match the chosen degraded-state policy.

**Acceptance criteria:** Normal domain state cannot contain duplicate IDs or multiple active rows. Normal non-empty state cannot contain zero current desktops. Tests prove duplicate and unmatched-current source data are handled deterministically. The model cannot expose multiple `active == true` rows while reporting one current index.

**Priority:** P1.

### Finding: Missing or invalid desktop state uses repeated primitive sentinels

**Evidence:** `src/tabpagerdesktopid.cpp:19-22` treats an invalid `QVariant` as invalid desktop ID; `src/tabpagerdesktoprows.h:36` stores `m_currentIndex = -1`; `src/tabpagerdesktopnavigator.h:8-10` defaults `currentIndex = -1`; `src/tabpagerdesktopnavigator.cpp:46-50` revalidates negative/out-of-range current index; `src/taskmanagerdesktopsource.cpp:62-66` separately checks `desktopId.isValid()` before activation; `package/contents/ui/PagerDesktopStrip.qml:40-49` creates a hidden metrics button with `index: -1`.

**Current state:** Absence is represented as invalid `TabPagerDesktopId`, `-1`, `std::optional`, silent filtering, and fake QML indices depending on the layer.

**Design concern:** Callers must know which absence convention applies in each layer, which makes future navigation, activation, and row-projection code easy to get wrong.

**Correct end state:** Internally, use one representation for selected desktop absence, preferably `std::optional<int>` or a small selected-index value type. Convert to Qt/QML's `-1` only at the `Q_PROPERTY currentIndex` boundary. Define one boundary where raw invalid desktop IDs are rejected or normalized.

**Suggested migration:** Add an internal selected-index type in `TabPagerDesktopRows` and `TabPagerDesktopModelState`. Keep `TabPagerDesktopModel::currentIndex()` returning `-1` for QML compatibility. Change `TabPagerDesktopNavigator` to accept optional or already-validated current index. Replace the hidden metrics `DesktopButton` with a metrics-only component that does not need a fake activation index.

**Acceptance criteria:** Internal navigation code no longer depends on `-1`. Public `-1` behavior is limited to the Qt/QML model boundary. Tests cover missing current desktop, invalid IDs, and invalid activation through one documented contract.

**Priority:** P2.

### Finding: Wheel delta accumulation has no lifecycle invariant

**Evidence:** `src/tabpagerdesktopnavigator.h:21-27` stores both wrapping and `m_pendingWheelDelta`; `src/tabpagerdesktopnavigator.cpp:67-76` updates pending delta before target resolution; `src/tabpagerdesktopnavigator.cpp:46-50` validates context only inside `targetIndexForOffset()`; `src/tabpagerbackend.cpp:55-68` applies source state and wrapping changes without resetting pending wheel delta; `tests/tabpagerdesktopnavigator_test.cpp:121-134` covers accumulation only under stable valid context.

**Current state:** Partial wheel deltas can persist across current-desktop changes, desktop-count changes, missing-current states, empty states, and wrapping-setting changes.

**Design concern:** A later navigation can depend on stale partial input from a different desktop state.

**Correct end state:** Wheel accumulation needs an explicit lifecycle. Either make wheel target calculation pure by passing accumulator state in and out, or keep mutable state but reset it when the navigation context becomes invalid or materially changes.

**Suggested migration:** Add tests for partial wheel deltas followed by source-state changes, missing-current state, empty state, and wrapping changes. Add `resetWheelDelta()` or extract the accumulator so update/reset policy is visible in one owner.

**Acceptance criteria:** Pending wheel delta cannot carry from invalid context into later valid context unless intentionally specified by tests. Changes to `currentIndex`, `count`, or wrapping have covered accumulator behavior.

**Priority:** P2.

### Finding: Row-change validity relies on public invalid state and debug-only assertion

**Evidence:** `src/tabpagerdesktoprows.h:13-17` defines public `TabPagerDesktopRowsChange` with default invalid row range and arbitrary roles; `src/tabpagerdesktoprows.cpp:124-127` exposes `changesTo()` and protects same-identity precondition only with `Q_ASSERT`; `src/tabpagerdesktopmodel.cpp:86-97` trusts row changes for `dataChanged`; `src/tabpagerdesktopmodelstate.cpp:41-52` currently calls `changesTo()` only after `hasSameIdentityAs()`.

**Current state:** The current call path is safe, but the lower-level API can represent invalid row-change ranges and can be called with incompatible identities in release builds.

**Design concern:** A future caller could emit row-level `dataChanged` where a model reset is required, violating Qt model semantics.

**Correct end state:** Row changes should be produced only by validated transition planning. The identity precondition should be hidden inside the transition planner or represented as an explicit failure result.

**Suggested migration:** Make `changesTo()` private to transition planning or make it return failure for incompatible identities. Hide or validate construction of row-change ranges.

**Acceptance criteria:** Incompatible identities cannot silently produce row changes in release builds. Tests cover incompatible row identity producing reset/failure, not `RowsChanged`.

**Priority:** P3.

## Cohesion, Coupling, and Ownership Problems

### Finding: `TabPagerBackend` mixes model, controller, source synchronization, and navigation

**Evidence:** `src/tabpagerbackend.h:13-44` makes `TabPagerBackend` inherit from `TabPagerDesktopModel`, own `TabPagerDesktopSource` and `TabPagerDesktopNavigator`, expose QML invokables, and expose wrapping state; `src/tabpagerbackend.cpp:22-28` maps model index to desktop ID and commands the source; `src/tabpagerbackend.cpp:40-58` connects/reloads/applies source state; `src/tabpagerbackend.cpp:61-87` owns navigation flow; `package/contents/ui/main.qml:39-85` uses one object as model, count provider, font provider, wheel target, and click target.

**Current state:** `TabPagerBackend` is simultaneously QML facade, list model, source synchronizer, activation controller, navigation owner, and presentation font provider through inheritance.

**Design concern:** Responsibilities with different rates of change are tied to one class and one QML object. Removing or changing wheel navigation, TaskManager activation, model shape, or source synchronization would all touch the same center.

**Correct end state:** `TabPagerDesktopModel` should own only Qt model behavior and model state. A QML-facing facade may remain, but it should compose a `TabPagerDesktopModel`, source, navigator/controller, and presentation settings, exposing an explicit `model` property plus command methods. Source synchronization should belong to an application/controller layer, not the list model.

**Suggested migration:** Introduce composition inside `TabPagerBackend` while forwarding existing properties temporarily. Move activation/navigation orchestration into a small controller. Update QML to use `model: backend.model` and keep command calls on the facade. Move `desktopIdForIndex()` behind an explicit model query interface used by the controller.

**Acceptance criteria:** `TabPagerBackend` no longer subclasses `TabPagerDesktopModel`. `TabPagerDesktopModel` has no source, activation, navigation, or font responsibility. QML uses an explicit model property for rows. Command/navigation tests can run without asserting model reset/data-change behavior in the same fixture.

**Priority:** P1.

### Finding: TaskManager adapter ownership is split across two seams

**Evidence:** `src/tabpagervirtualdesktopinfo.h:13-35` defines `TabPagerVirtualDesktopInfo` and declares `createTaskManagerVirtualDesktopInfo()`; `src/tabpagervirtualdesktopinfo.cpp:8-24` wraps `TaskManager::VirtualDesktopInfo`; `src/tabpagervirtualdesktopinfo.cpp:32-44` forwards TaskManager signals; `src/taskmanagerdesktopsource.cpp:21-32` forwards wrapper signals again; `src/taskmanagerdesktopsource.cpp:37-59` maps wrapper data into `TabPagerDesktopSourceState`; `tests/taskmanagerdesktopsource_test.cpp:14-77` injects a fake low-level wrapper.

**Current state:** There are two adapter layers between LibTaskManager and the application source port. The low-level abstraction also exposes a concrete TaskManager factory.

**Design concern:** The test seam is useful, but ownership is fuzzy. Replacing or extending LibTaskManager integration requires touching both raw wrapper and source adapter, and source-change ownership is split between both.

**Correct end state:** `TabPagerDesktopSource` should be the app-level port. `TaskManagerDesktopSource` should be the clear owner of KDE integration and raw-to-domain normalization. `TabPagerVirtualDesktopInfo` should either be private scaffolding for that adapter or be collapsed into `TaskManagerDesktopSource`; its concrete factory should not live on the abstraction header.

**Suggested migration:** Move `createTaskManagerVirtualDesktopInfo()` out of `tabpagervirtualdesktopinfo.h`. Decide whether `TabPagerVirtualDesktopInfo` is a stable port or private adapter seam. Consolidate signal forwarding so one layer decides when source state changed.

**Acceptance criteria:** Public source consumers depend only on `TabPagerDesktopSource`. The concrete TaskManager factory is not declared on the abstraction header. A new TaskManager field requires changing one adapter boundary. Existing TaskManager source tests still cover projection and activation.

**Priority:** P2.

### Finding: Row projection leaks Qt roles into lower-level diffing

**Evidence:** `src/tabpagerdesktoprows.h:13-17` stores `QList<int> roles` in `TabPagerDesktopRowsChange`; `src/tabpagerdesktoprow.h:14-21` defines `TabPagerDesktopRowRole` using `Qt::UserRole`; `src/tabpagerdesktoprow.cpp:52-63` binds row fields directly to role IDs and names; `src/tabpagerdesktoprows.cpp:124-133` calls `tabPagerDesktopRowChangedRoles()` from row diffing; `src/tabpagerdesktopmodel.cpp:91-96` emits `dataChanged(..., rowUpdate.roles)`.

**Current state:** `TabPagerDesktopRows` computes row changes already expressed as Qt role IDs.

**Design concern:** The row/projection layer partly owns QAbstractItemModel notification semantics. Reusing row diffing outside Qt or changing model roles requires modifying lower-level row code.

**Correct end state:** `TabPagerDesktopRows` should return semantic row changes, such as changed fields and row ranges. `TabPagerDesktopModel` should translate semantic fields to Qt roles because it owns the Qt model contract.

**Suggested migration:** Add a semantic changed-field enum independent of `Qt::UserRole`. Store semantic fields in `TabPagerDesktopRowsChange`. Move semantic-field-to-role conversion into `TabPagerDesktopModel`. Keep role names and `QVariant` conversion at the model adapter boundary.

**Acceptance criteria:** `TabPagerDesktopRowsChange` no longer stores Qt role IDs. `TabPagerDesktopRows` does not depend on role-name helpers. Only `TabPagerDesktopModel` maps fields to `QAbstractItemModel` roles. Current `dataChanged` behavior remains covered by tests.

**Priority:** P2.

### Finding: Fixed-font presentation policy is owned by the core list model

**Evidence:** `docs/spec/SPEC.md:25` requires KDE's fixed-width font; `src/tabpagerdesktopmodel.h:18,32` exposes `QFont labelFont`; `src/tabpagerdesktopmodel.cpp:42-44` returns `QFontDatabase::systemFont(QFontDatabase::FixedFont)`; `package/contents/ui/main.qml:43-47,78-83` uses `backend.labelFont`; `CMakeLists.txt:55-58` links `tabpagermodel` publicly to `Qt6::Gui`.

**Current state:** The list model owns a presentation/platform font policy used only for QML layout and labels.

**Design concern:** The model has UI styling responsibility and a GUI/font dependency even when tests or consumers only need desktop row state.

**Correct end state:** Font selection should live in the QML/presentation facade or a dedicated presentation settings object. The desktop model should expose desktop row data only. If C++ must provide the exact system font, expose it from `TabPagerBackend` facade or `TabPagerPresentationSettings`, not from `TabPagerDesktopModel`.

**Suggested migration:** Move `labelFont` to `TabPagerBackend` facade or a presentation settings object while forwarding temporarily for QML. Remove `QFontDatabase` from `TabPagerDesktopModel` once callers are migrated. Keep layout metrics tests proving fixed-font sizing behavior.

**Acceptance criteria:** `TabPagerDesktopModel` no longer exposes `QFont` or includes `QFontDatabase`. `tabpagermodel` no longer publicly links `Qt6::Gui` unless another model responsibility requires it. QML still uses KDE's configured fixed-width font.

**Priority:** P2.

### Finding: Panel layout ownership is spread across root, metrics, strip, and button

**Evidence:** `package/contents/ui/main.qml:16-35` computes orientation and applies layout constraints; `main.qml:49-55` feeds content implicit size into `PagerLayoutMetrics`; `main.qml:67-85` wires metrics, padding, model, font, orientation, and activation into `PagerDesktopStrip`; `PagerLayoutMetrics.qml:13-33` owns sizing values; `PagerDesktopStrip.qml:24-116` selects horizontal/vertical layouts and duplicates delegate wiring; `DesktopButton.qml:26-35` contributes implicit sizing.

**Current state:** Panel layout behavior is distributed across several QML components. Orientation is interpreted by both metrics and strip, and delegate wiring is repeated for horizontal and vertical paths.

**Design concern:** Changing layout behavior requires following the contract across multiple files, and future edits can diverge between orientations.

**Correct end state:** One QML component should own the panel layout contract: orientation, final sizing, layout mechanics, and delegate wiring. `main.qml` should remain Plasma shell and top-level composition. `DesktopButton` should remain a visual leaf.

**Suggested migration:** Keep `PagerLayoutMetrics` as a tested pure calculation object if useful. Move shared delegate wiring into one component. Let `PagerDesktopStrip` or a new `PagerPanelLayout` own orientation-specific layout behavior. Add an integration QML test covering horizontal and vertical composition.

**Acceptance criteria:** Orientation-specific behavior is localized to one component boundary. Horizontal and vertical delegates share common property wiring. `main.qml` no longer coordinates detailed sizing internals. Existing layout metrics tests continue to pass.

**Priority:** P3.

## Logic Placement and Flow Predictability

### Finding: Wheel navigation semantics are split between QML and C++

**Evidence:** `docs/spec/SPEC.md:33-35` defines scroll behavior; `package/contents/ui/main.qml:57-64` selects `angleDelta.y || angleDelta.x`, applies `wheel.inverted`, and passes an integer delta; `src/tabpagerbackend.cpp:35-37` forwards that delta; `src/tabpagerdesktopnavigator.cpp:7,26-33,67-76` owns the 120-unit threshold, accumulation, and positive-step to negative-offset mapping; `tests/tabpagerdesktopnavigator_test.cpp:82-135` and `tests/tabpagerbackend_test.cpp:374-407` cover only normalized deltas.

**Current state:** QML owns raw event normalization, while C++ owns accumulation and final direction mapping.

**Design concern:** Understanding or changing the user-facing rule requires reading both QML and C++. Axis selection and inversion are not directly covered by the current C++ tests.

**Correct end state:** Wheel input handling should have one explicit owner. Prefer a pure `TabPagerWheelNavigation` helper/controller that accepts raw wheel fields, owns axis selection, inversion, accumulation, and conversion to semantic offsets. `TabPagerDesktopNavigator` should resolve desktop offsets only.

**Suggested migration:** Add characterization tests for vertical, horizontal-only, inverted, zero, and mixed-axis wheel input. Introduce the helper and replace inline QML sign/axis logic with a thin call or raw-field forwarding. Keep `targetIndexForOffset()` pure.

**Acceptance criteria:** Axis selection, inversion, threshold, and direction are tested in one place. `main.qml` no longer contains sign/axis policy. `TabPagerDesktopNavigator` no longer stores wheel-specific pending state once the helper is in place.

**Priority:** P2.

### Finding: `targetIndexForWheelDelta()` is a mutating query

**Evidence:** `src/tabpagerdesktopnavigator.h:18-27` exposes `targetIndexForWheelDelta()` as a target calculation and stores `m_pendingWheelDelta`; `src/tabpagerdesktopnavigator.cpp:67-76` mutates `m_pendingWheelDelta` before returning; `src/tabpagerbackend.cpp:35-37` calls it from `activateByWheelDelta()`.

**Current state:** A method named like a query consumes input and changes object state even when no target exists.

**Design concern:** Flow is harder to reason about because a no-op result can still alter future wheel behavior.

**Correct end state:** Accumulation should be command-like and explicit. Either separate a wheel accumulator from desktop navigation, or rename/model the operation as `consumeWheelDelta()` returning accumulator state plus semantic offset or target.

**Suggested migration:** Extract accumulation into a value-returning helper, keep index resolution pure, and have the backend/controller apply returned commands only when present.

**Acceptance criteria:** No method named like a pure target query mutates pending wheel state. Tests assert emitted targets and retained/remainder state.

**Priority:** P2.

## Testability Problems

### Finding: QML composition hard-wires the production desktop source

**Evidence:** `package/contents/ui/main.qml:39-41` instantiates `TabPager.TabPagerBackend`; `src/tabpagerqmlbackend.cpp:10-11` constructs `TabPagerBackend(std::make_unique<TaskManagerDesktopSource>())`; `src/taskmanagerdesktopsource.cpp:11-12` creates the real `TaskManager::VirtualDesktopInfo` adapter; existing tests avoid `main.qml` and inject fakes only through C++ helpers in `tests/tabpagerbackendtesthelpers.h:13-94`.

**Current state:** The production QML root owns backend creation and reaches the real KDE source. User-facing wiring in `main.qml` can only be tested as heavy Plasma/QML integration.

**Design concern:** There is a gap between well-tested C++ domain behavior and the actual QML composition users run, especially tooltip text, form-factor wiring, click activation, and wheel dispatch.

**Correct end state:** Split the UI into a thin `main.qml` Plasma shell and an injectable reusable view component, for example `TabPagerView.qml`, with required `backend`, `model`, `verticalPanel`, and layout inputs. Tests should load the reusable view with fake model/backend objects and no real `TaskManagerDesktopSource`.

**Suggested migration:** Extract most of `main.qml` into `TabPagerView.qml`. Keep `main.qml` responsible for `Plasmoid.*`, production backend creation, and shell-level attached properties. Add QML component tests for the view and keep only a smoke/integration check for the shell.

**Acceptance criteria:** A QML/component test verifies click and wheel wiring without constructing `TaskManagerDesktopSource`. `main.qml` contains only Plasma shell wiring and production object creation. The reusable view can be loaded by `QQmlComponent` without importing `org.kde.plasma.plasmoid`.

**Priority:** P1.

### Finding: Source-state projection requires QObject fakes for simple mapping tests

**Evidence:** `src/taskmanagerdesktopsource.cpp:37-59` maps raw virtual desktop info to source state; `tests/taskmanagerdesktopsource_test.cpp:13-77` defines a full `FakeVirtualDesktopInfo` QObject subclass; `tests/taskmanagerdesktopsource_test.cpp:113-130` verifies projection through the adapter; `tests/taskmanagerdesktopsource_test.cpp:133-145` verifies signal fan-in through the same fake.

**Current state:** Pure projection and QObject signal forwarding are tested through one signal-capable fake.

**Design concern:** Adding edge cases such as mismatched IDs/names, duplicate IDs, invalid IDs, or missing current desktop will require more QObject fake maintenance than the pure mapping deserves.

**Correct end state:** Separate pure projection from QObject wiring. `TaskManagerDesktopSource` should read from `TabPagerVirtualDesktopInfo` and delegate to a pure mapper. Adapter tests should cover signal forwarding and activation forwarding; mapper tests should use raw values directly.

**Suggested migration:** Extract projection from `TaskManagerDesktopSource::sourceState()` into a pure helper. Add direct tests for raw edge cases. Keep one fake-based test for signal forwarding.

**Acceptance criteria:** Mapping from raw virtual desktop info to source state is testable without a QObject fake. Signal forwarding remains covered by one adapter-level test. `TaskManagerDesktopSource::sourceState()` becomes a thin read-and-map method.

**Priority:** P2.

## Error Handling and Observability Problems

### Finding: Activation no-ops have no reason or diagnostic

**Evidence:** `src/tabpagerbackend.cpp:22-29` returns from `activate(int)` when `desktopIdForIndex(index)` has no value; `src/tabpagerbackend.cpp:78-82` ignores `std::nullopt` navigation targets; `src/tabpagerdesktopnavigator.cpp:48-50,59-60,72-73` returns `std::nullopt` for invalid context, edge stops, and insufficient wheel delta; `tests/tabpagerbackend_test.cpp:284-337` verifies invalid activation and edge/missing-current cases are ignored.

**Current state:** Normal edge stops, no wheel step, no current desktop, invalid index, invalid desktop ID, and malformed source state all collapse into quiet no-op paths.

**Design concern:** From production behavior, "nothing happened" has several possible causes with different debugging value.

**Correct end state:** Keep expected user-facing no-ops quiet, but introduce an internal activation/navigation result taxonomy owned by the backend/controller domain, such as `Activated`, `NoWheelStep`, `StoppedAtEdge`, `NoCurrentDesktop`, `InvalidIndex`, and `InvalidDesktopId`. The facade should decide which results are ignored, tested, or logged.

**Suggested migration:** Add a pure internal method that returns an activation result while preserving the `Q_INVOKABLE void` API. Update tests to assert result taxonomy for backend/controller-level cases. Add logs only for unexpected or diagnostically useful failures.

**Acceptance criteria:** Tests distinguish invalid index, missing current desktop, edge stop, no wheel step, and successful activation. Runtime visible behavior remains unchanged. Unexpected no-op causes can be traced through a named logging category.

**Priority:** P1.

### Finding: Source anomalies are silently normalized away

**Evidence:** `src/taskmanagerdesktopsource.cpp:44-48` silently converts missing names to empty names; `src/tabpagerdesktoprows.cpp:31-39` silently skips invalid IDs; `src/tabpagerdesktoprows.cpp:44-52` returns `-1` when current desktop does not match a row; no project logging calls exist in `src/` or `package/contents/ui/`.

**Current state:** Malformed source data becomes fewer rows, empty labels, or no current index without project-owned health information.

**Design concern:** If LibTaskManager supplies unexpected data, an installed widget can appear empty or inactive with no stable diagnostic.

**Correct end state:** Source normalization should return normalized state plus structured diagnostics for invalid IDs, name count mismatches, duplicate IDs, and unmatched current desktop. The model should receive only normalized rows. Diagnostics should feed the project logging category.

**Suggested migration:** Add a mapper return type such as `{state, diagnostics}` and tests for each anomaly. Initially log diagnostics internally; expose user-facing degraded state only if needed later.

**Acceptance criteria:** Source adapter tests cover malformed snapshots explicitly. Invalid IDs, name mismatches, duplicate IDs, and unmatched current desktop are visible through structured diagnostics or logs. Valid snapshots preserve current model behavior.

**Priority:** P1.

### Finding: Fatal constructor preconditions rely on debug-only assertions

**Evidence:** `src/tabpagerbackend.cpp:40-43` uses `assert(m_source != nullptr)` and then connects/dereferences; `src/taskmanagerdesktopsource.cpp:14-19` uses `assert(m_info != nullptr)` and then connects/dereferences; `src/tabpagerplugin.cpp:11-14` uses `Q_ASSERT` for QML URI validation; `src/tabpagerbackend.h:19-20` and `src/taskmanagerdesktopsource.h:16-18` accept nullable `std::unique_ptr` dependencies.

**Current state:** Invalid construction is guarded only in debug builds. Release builds can proceed until a null dereference or unclear Qt connection behavior.

**Design concern:** Required dependencies are invalid-but-representable in the type system, and failure mode differs by build type.

**Correct end state:** Non-null dependencies should be enforced by type, private constructors plus factories, a non-null wrapper, or deterministic release-safe fatal checks with clear messages. Plugin URI mismatch should fail deterministically with a clear diagnostic.

**Suggested migration:** Add a narrow construction helper/factory for owned dependencies and replace debug-only checks with deterministic validation. Use a named logging category for fatal configuration/dependency failures.

**Acceptance criteria:** `TabPagerBackend` and `TaskManagerDesktopSource` cannot store null dependencies and continue. Debug and release builds handle invalid construction the same way. Tests or death-test equivalents cover invalid dependency paths where practical.

**Priority:** P2.

### Finding: No project-owned observability channel exists

**Evidence:** Targeted search found no `QLoggingCategory`, `qCWarning`, `qWarning`, `qCritical`, `console.warn`, or `console.error` in `src/` or `package/contents/ui/`; `src/tabpagerdesktopid.cpp:33-36` only provides a `QDebug` stream operator.

**Current state:** Runtime visibility depends on Qt/Plasma defaults. The plugin has no named logging category.

**Design concern:** Users and maintainers have no stable category to enable when the widget is empty, inactive, or fails to switch desktops.

**Correct end state:** Add one small logging category for Tab Pager, used at ownership boundaries: source normalization anomalies, unexpected activation no-ops, activation requests sent to LibTaskManager if useful, and fatal construction/configuration failures. Do not add metrics or tracing until behavior becomes asynchronous or multi-process enough to justify it.

**Suggested migration:** Define a logging category in the native plugin/backend layer. Start with source adapter and activation result taxonomy logs. Keep normal edge stops unlogged or debug-only.

**Acceptance criteria:** `QT_LOGGING_RULES` can enable Tab Pager diagnostics by category. Logs identify source anomalies and unexpected activation failures without spamming normal interactions. Public API and visible behavior remain unchanged.

**Priority:** P2.

## Deletion, Modularity, and Abstraction Problems

### Finding: Features are hard to remove independently from `TabPagerBackend`

**Evidence:** `src/tabpagerbackend.h:13,25-28,43-44` combines model inheritance, command invokables, source ownership, and navigator ownership; `src/tabpagerbackend.cpp:22-87` contains activation, source synchronization, wrapping, and navigation; `package/contents/ui/main.qml:39-85` binds the same object to model and commands.

**Current state:** Removing wheel navigation, changing activation, or changing model shape all affects `TabPagerBackend` and QML bindings.

**Design concern:** A central class becomes a change amplifier even though each feature is small.

**Correct end state:** The same as the backend ownership end state: a composed facade with separate model, controller, source, and navigation/presentation collaborators.

**Suggested migration:** Perform the backend composition migration before adding new interaction features.

**Acceptance criteria:** Wheel support can be removed without changing desktop offset navigation or model state projection. Source replacement can happen through one source port. QML uses explicit model and command surfaces.

**Priority:** P1.

### Finding: Wheel support is interwoven with desktop offset navigation

**Evidence:** `src/tabpagerdesktopnavigator.h:21-27` owns both offset target calculation and wheel delta state; `src/tabpagerdesktopnavigator.cpp:67-76` combines wheel accumulation with offset navigation; `package/contents/ui/main.qml:57-64` owns raw wheel mapping.

**Current state:** Device input accumulation and desktop index movement live in one navigator plus one QML expression.

**Design concern:** Removing wheel support would require editing QML, backend API, navigator state, and tests.

**Correct end state:** A wheel input helper should own device-specific behavior. `TabPagerDesktopNavigator` should resolve semantic offsets only.

**Suggested migration:** Extract wheel mapping/accumulation after characterization tests, then keep `activateNext()`, `activatePrevious()`, and offset target calculation independent.

**Acceptance criteria:** Removing wheel support does not require changing `targetIndexForOffset()` or desktop state projection.

**Priority:** P2.

## Recommended Correct End-State Architecture

The desired architecture is intentionally modest and close to the current code.

**Domain/state ownership:** Introduce a normalized `TabPagerDesktopState` or equivalent in the model/domain target. It owns desktop identity uniqueness, current desktop membership/cardinality, selected index representation, and source degradation/anomaly outcomes. Raw `TabPagerDesktopSnapshot` should either become a raw-source DTO or be replaced by a normalized state object before model projection.

**Model adapter ownership:** `TabPagerDesktopModel` owns `QAbstractListModel` behavior only: row count, role names, `QVariant` role data, model reset, `dataChanged`, `countChanged`, and `currentIndexChanged`. It translates semantic row fields to Qt roles. It does not own source lifecycle, activation, navigation, font policy, or raw source validation.

**Application/controller ownership:** A small controller owns source synchronization, activation commands, navigation command interpretation, and activation result taxonomy. It composes a `TabPagerDesktopSource`, `TabPagerDesktopModel`, and navigation helpers. It exposes no Qt model inheritance.

**QML facade ownership:** `TabPagerBackend` or a renamed facade remains the convenient QML type, but by composition. It exposes a `model` property, command invokables, `navigationWrappingAround`, and presentation settings such as `labelFont` if C++ must provide them. It forwards compatibility properties only during migration.

**Source/infrastructure ownership:** `TabPagerDesktopSource` is the app-level port. `TaskManagerDesktopSource` owns LibTaskManager integration, raw signal fan-in, raw-to-normalized mapping, activation forwarding, and source diagnostics. `TabPagerVirtualDesktopInfo` is either a private seam inside that adapter or collapsed; its concrete factory should not sit on the abstraction header.

**QML presentation ownership:** `main.qml` is the Plasma shell: `Plasmoid.*`, production backend creation, and top-level composition. A reusable `TabPagerView.qml` owns the actual widget view with injected backend/model and orientation. One layout coordinator owns panel orientation, sizing, gap, insets, and delegate wiring. `DesktopButton` remains a leaf visual component.

**External effects isolation:** LibTaskManager access, Qt logging, QML shell integration, and font lookup stay at infrastructure/presentation boundaries. Raw source mapping, row projection, semantic diffs, desktop navigation offsets, and wheel mapping/accumulation should be pure or value-returning where practical.

**Error representation:** Expected no-ops remain invisible to the user, but internal operations should return structured results. Source normalization should return structured diagnostics. Fatal construction/configuration failures should be deterministic in release and debug builds. A named `QLoggingCategory` should be the single observability entry point.

**Test structure:** Keep current C++ model/navigation tests, but add characterization tests before moving behavior. Add pure mapper tests for raw source normalization, pure wheel mapping tests, controller tests for activation result taxonomy, and QML component tests for the extracted injectable view. Keep one production shell smoke test rather than making all UI tests load the full Plasma shell.

## Suggested Refactoring Sequence

1. **Add characterization tests around current behavior.** Cover duplicate IDs, unmatched current desktop, mismatched ID/name lengths, invalid IDs, partial wheel deltas across state changes, inverted/horizontal wheel mapping, activation no-op categories, and QML view click/wheel wiring.
2. **Centralize duplicated rules/state.** Introduce normalized desktop state and source diagnostics; centralize invalid ID/current selection policy; make package/module identity and QML layout constants generated or verified from one owner.
3. **Isolate core domain logic from external effects.** Extract raw source mapping from QObject signal wiring; extract wheel event mapping/accumulation from QML and desktop offset navigation; move font lookup out of the core model.
4. **Clarify ownership boundaries.** Convert `TabPagerBackend` from model inheritance to composition; expose an explicit model property; move source synchronization and activation/navigation commands into a controller; move Qt role translation fully into `TabPagerDesktopModel`.
5. **Improve error semantics and observability.** Add activation/navigation result types, source anomaly diagnostics, deterministic constructor dependency validation, and one named logging category.
6. **Remove or simplify premature abstractions.** Decide whether `TabPagerVirtualDesktopInfo` is a private adapter seam or collapse it; remove concrete factory declarations from abstraction headers; simplify QML layout ownership; remove temporary facade forwarding after QML is migrated.

## Things Not To Change Yet

- Do not rewrite the widget around a larger framework or introduce a broad architecture pattern; the codebase is small and benefits from boring, local ownership boundaries.
- Do not change visible desktop labeling, navigation wrapping, edge-stop, or invalid-source behavior until characterization tests pin current behavior and a specific bug is identified.
- Do not add user-facing degraded states for malformed source data yet; start with internal diagnostics and logs.
- Do not add metrics, tracing, retry machinery, or audit trails. A named Qt logging category is enough for the current synchronous plugin shape.
- Do not remove the existing C++ test coverage while migrating; use it as the behavior safety net.
- Do not optimize packaging identity generation before adding a check that proves the current repeated values agree.
- Do not collapse all QML components into one file. The issue is unclear ownership, not component count.

## Appendix: Subagent Reports

### Single Source of Truth / Duplication Agent

Accepted and merged. The duplicated invalid-state sentinel finding was merged into **Missing or invalid desktop state uses repeated primitive sentinels**. The duplicated raw signal enumeration was kept as a P2 single-source finding. Package/module identity drift was kept as a P2 packaging risk. QML layout constants were kept as P3. No contradiction with other reports.

### Invariant / Correctness Agent

Accepted and prioritized. **Active desktop cardinality is not centrally protected** became the top correctness finding. Raw source normalization was merged with source-boundary and observability findings. Wheel accumulator lifecycle was kept as P2 and merged with the wheel-flow design. Null dependency assertions were merged into error handling. Row-change validity was kept as P3 because the current internal call path is safe but the public API is fragile.

### Cohesion / Coupling / Ownership Agent

Accepted and merged. The `TabPagerBackend` finding was upgraded/kept as P1 because multiple agents independently identified it and QML depends on the inheritance surface. Row-role leakage, font policy, TaskManager adapter ownership, and QML layout ownership were retained at P2/P3. No generic ownership advice was retained without file evidence.

### Logic Placement / Flow Readability Agent

Accepted and merged. Wheel semantics split between QML and C++ and the mutating `targetIndexForWheelDelta()` query were kept as separate but related P2 findings. Backend, font, and panel-layout findings were merged with ownership sections. The panel-layout finding stayed P3 because it is a maintainability risk, not a current correctness issue.

### Testability Agent

Accepted. The hard-wired QML production backend became a P1 testability finding because it blocks cheap tests for user-facing wiring. Source projection requiring QObject fakes was retained at P2. Font dependency and wheel mapping findings were merged with ownership and flow sections.

### Error Handling / Observability Agent

Accepted. Activation no-op taxonomy and source anomaly diagnostics were retained as P1 because they directly affect debugging correctness-sensitive behavior. Debug-only constructor checks and missing logging category were retained as P2. No recommendation for broad metrics/tracing was retained.

### Deletion / Modularity / Abstraction Agent

Accepted and merged. Backend feature interdependence was merged with the P1 backend ownership finding. TaskManager seams, row-role leakage, wheel interweaving, font ownership, and panel layout were merged into their respective sections. No findings were rejected, but duplicates were consolidated and priorities were normalized across reports.
