# Design Review: Correct End State

## Executive Summary

The codebase is small and already has useful seams: TaskManager raw-state mapping is mostly pure, navigation target calculation is separated from QML rendering, and the model-state transition code has targeted tests. The main architectural risk is not lack of layering; it is that several important contracts are still implied by convention instead of being owned by a focused boundary.

The highest-impact remaining issue is that orchestration, state projection, navigation, and effects converge in `TabPagerDesktopController`. The controller owns the source, mutates the Qt model, reads the Qt model for activation, owns the navigator, consumes wheel deltas, translates navigation results into activation results, and dispatches source activation. That is manageable at the current size, but it is the pressure point where new behavior will become harder to test and reason about.

The second major risk is operational visibility. `TaskManagerDesktopSource::sourceState() const` still performs diagnostic reporting from a getter-shaped API, and the generic source state still does not carry diagnostic health. `TaskManagerDesktopSource` now has a structured diagnostics read seam and suppresses unchanged duplicate warning logs, but backend/controller observability remains incomplete.

No P0 issue was found. The recommended end state is a precise, boring architecture: a small application state store, pure planners for navigation/activation/input mapping, Qt/QML adapters around those seams, and explicit diagnostic/error channels.

## Top Design Risks

1. `TabPagerDesktopController` spans source ownership, source reloads, Qt model mutation, model reads, navigation, wheel consumption, result translation, logging, and activation effects.
2. Source diagnostics are still emitted from a const read path, and degraded source state is not part of the application state contract. A source-specific structured read seam exists, and unchanged repeated diagnostics are logged only once per diagnostic state.
3. Wheel input semantics are split between QML event normalization and C++ navigation state, with unclear scoping for accumulated partial wheel deltas across desktop/context changes.

## Single Source of Truth Violations

### Finding: Package identity and module metadata are repeated

Priority: P2

Evidence: `CMakeLists.txt` defines project version, `QML_MODULE_URI`, and `PLASMOID_ID`; `package/metadata.json` repeats the ID and version; `src/qmldir` repeats the QML module URI; `src/tabpagerplugin.qmltypes` repeats the module URI and type version; `nix/module/package.nix` repeats `pluginId` and `version`; `nix/lib/tab-pager-ci.nix` hard-codes the installed QML module path.

Current state: One release/install contract is declared across CMake, KPackage metadata, QML metadata, and Nix packaging/check code.

Design concern: A mismatch can produce a package whose Plasma ID, install destination, QML import URI, qmltypes export, and Nix metadata disagree.

Correct end state: One source should own package identity, version, QML module URI, and module path. Other files should be generated, configured, or checked against it.

Suggested migration: Pick an authority, likely CMake variables or `package/metadata.json`, then generate/configure `qmldir`, qmltypes export metadata, package metadata fragments, and Nix check paths from that authority or verify agreement in CI.

Acceptance criteria: Changing package ID or version requires editing one authoritative declaration. CI verifies that `package/metadata.json`, installed plasmoid path, `qmldir`, qmltypes export, and Nix checks agree.

### Finding: Layout constants have local duplicate defaults

Priority: P3

Evidence: `package/contents/ui/PagerLayoutMetrics.qml` defines `desktopGap: 1`; `package/contents/ui/PagerDesktopStrip.qml` also defaults `desktopGap: 1`; `TabPagerView.qml` passes `layoutMetrics.desktopGap` into `PagerDesktopStrip`; `PagerLayoutMetrics.qml` repeats `1` as minimum extent; `PagerDesktopStrip.qml` repeats minimum extent in implicit size clamps and `Layout.minimumWidth: 1`; `tests/tabpagerlayoutmetrics_test.cpp` repeats `fillMinimumExtent = 1.0`.

Current state: `PagerLayoutMetrics` is effectively the production owner when assembled, but child components still carry independent defaults and repeated literals.

Design concern: If KDE pager spacing or minimum extent rules change, several QML components and tests need synchronized edits.

Correct end state: Layout constants should be owned by one layout metrics component or constants object. Consumers should receive values explicitly.

Suggested migration: Make `PagerDesktopStrip.desktopGap` required. Introduce named constants for minimum extent and unset preferred extent at the layout-metrics layer.

Acceptance criteria: `desktopGap` has one production definition. Minimum extent literals are named at the owner. Tests assert behavior through the owner rather than child defaults.

## Invariant and Correctness Risks

### Finding: Wheel delta accumulation is not scoped to navigation context

Priority: P2, uncertain

Evidence: `src/tabpagerdesktopnavigator.h` stores `m_pendingWheelDelta`; `src/tabpagerdesktopnavigator.cpp` combines pending and new delta, stores the remainder, then validates navigation context through `targetForOffset()`; `src/tabpagerdesktopcontroller.cpp` updates model and wrapping state without resetting pending wheel delta; navigator tests cover accumulation only in a stable context.

Current state: Partial wheel deltas survive changes to current desktop, desktop count, and wrapping behavior. They can also survive contexts where there is no current desktop. Characterization tests now lock this as current behavior rather than intended policy.

Design concern: The spec says scrolling moves one desktop at a time, but it does not define whether sub-step wheel accumulation should survive model/current-desktop changes. If persistence is not intended, stale input from a previous context can trigger activation later under a different context.

Correct end state: Wheel accumulation scope should be explicit. Either document and test that pending deltas intentionally survive context changes, or reset/drop pending deltas when navigation context changes or when no navigation target can be produced.

Suggested migration: Use the characterization tests for half-step input before current desktop appears, before desktop count changes, before wrapping changes, and at non-wrapping edges to either clear pending delta on context identity change or document preservation as intended behavior.

Acceptance criteria: Tests define pending wheel behavior across current desktop changes, desktop count changes, wrapping changes, no-current states, and stopped-at-edge states. No activation is caused solely by stale partial wheel delta unless explicitly specified.

## Cohesion, Coupling, and Ownership Problems

### Finding: `TabPagerDesktopController` owns too many responsibilities

Priority: P2

Evidence: `src/tabpagerdesktopcontroller.h` includes `tabpagerdesktopmodel.h`, accepts both `std::unique_ptr<TabPagerDesktopSource>` and `TabPagerDesktopModel &`, stores a non-owning model reference, and owns the source; `src/tabpagerdesktopcontroller.cpp` connects source changes, reloads source state, mutates the model with `setDesktopSnapshot()`, reads model IDs for activation, reads model `currentIndex()`/`count()` for navigation context, owns the navigator, translates navigation results, logs no-ops, and calls source activation.

Current state: The controller is source owner, source subscriber, source reloader, model writer, model reader, navigation coordinator, wheel consumer, activation planner, result translator, logger, and effect dispatcher.

Design concern: The controller couples application behavior to the Qt list model. This makes `TabPagerDesktopModel` part of the application logic contract rather than a replaceable projection of desktop state.

Correct end state: The controller should depend on a small desktop state/navigation port, not directly on a `QAbstractListModel`-backed model. The Qt model should adapt state transitions into `beginResetModel()`, `endResetModel()`, and `dataChanged()` notifications.

Suggested migration: Introduce a `TabPagerDesktopStateStore` or equivalent with `setSnapshot`, `desktopIdForIndex`, `currentIndex`, and `count`. Let the controller mutate/read that store. Let `TabPagerDesktopModel` observe or adapt the store/state transitions for QML.

Acceptance criteria: `tabpagerdesktopcontroller.h` no longer includes `tabpagerdesktopmodel.h`. Controller tests can instantiate the controller without constructing `TabPagerDesktopModel`. Qt model notification semantics stay inside `TabPagerDesktopModel`.

### Finding: Desktop source also owns navigation policy state

Priority: P2

Evidence: `src/tabpagerdesktopsource.h` defines `TabPagerDesktopSourceState` with both `desktopSnapshot` and `navigationWrappingAround`; `TaskManagerDesktopSource::connectDesktopInfo()` wires `navigationWrappingAroundChanged` into the same `sourceStateChanged` signal as desktop IDs, names, count, and current desktop; `TabPagerDesktopController::applySourceState()` applies both desktop snapshot and navigation wrapping from the same source state.

Current state: A `TabPagerDesktopSource` provides desktop data and interaction policy.

Design concern: Desktop topology/current-desktop state and navigation policy have different ownership. A wrapping-setting change currently drives a generic source reload and model snapshot application even if desktop data is unchanged.

Correct end state: Desktop state and navigation settings should be separate inputs. The controller/backend can compose them, but the desktop source abstraction should not own interaction behavior policy.

Suggested migration: Split `navigationWrappingAround` out of `TabPagerDesktopSourceState` into a dedicated provider or signal, such as `TabPagerNavigationSettingsSource`. `TaskManagerDesktopSource` can still adapt TaskManager APIs internally, but should expose desktop and settings updates through separate contracts.

Acceptance criteria: `TabPagerDesktopSourceState` contains only desktop snapshot data. Wrapping changes do not require `m_source->sourceState()` reload. Tests distinguish desktop-source updates from navigation-setting updates.

### Finding: QML model roles expose internal fields not used by the widget

Priority: P2

Evidence: `src/tabpagerdesktoprow.h` defines roles/row data for `desktopId`, `name`, `label`, `number`, and `active`; `src/tabpagerdesktoprow.cpp` registers all fields in a generic role table; shipped QML `DesktopButton.qml` requires only `active`, `index`, and `label`; `tests/tabpagerview_test.cpp` proves the view loads with a fake model exposing only `label` and `active`; `tests/tabpagerbackend_test.cpp` locks all five roles as backend contract.

Current state: The public model API exposes domain/internal data that QML does not consume. `desktopId` is needed internally for activation lookup; `name` and `number` are inputs to label generation, but all three are public roles.

Design concern: The model API is broader than the widget contract. Removing or renaming internal fields becomes a public model change even if the UI only needs `label` and `active`.

Correct end state: Separate internal row identity from public row presentation. Keep `desktopId` in internal state for `desktopIdForIndex()`, but expose only roles required by QML and documented behavior unless there is an explicit extension API requirement.

Suggested migration: Narrow `roleNames()` and `tabPagerDesktopRowDataForRole()` to public roles. Keep internal row-state tests for `desktopId`, `name`, and `number` if needed.

Acceptance criteria: QML still renders labels and active state. Activation by index still works through internal `desktopIdForIndex()`. Backend role tests assert only supported public roles. No shipped QML depends on `desktopId`, `name`, or `number`.

### Finding: Two adapter seams wrap the same LibTaskManager dependency

Priority: P3

Evidence: `TabPagerVirtualDesktopInfo` abstracts LibTaskManager-style getters and signals; its only production implementation forwards one-to-one to `TaskManager::VirtualDesktopInfo`; `TaskManagerDesktopSource` is a second adapter that owns `std::unique_ptr<TabPagerVirtualDesktopInfo>`; the only non-production `TabPagerVirtualDesktopInfo` implementation is the source test fake.

Current state: There is a domain source abstraction (`TabPagerDesktopSource`) and a lower-level virtual desktop info abstraction (`TabPagerVirtualDesktopInfo`). The lower-level abstraction mainly supports source tests.

Design concern: The provider boundary is unclear. A future source provider must choose whether to implement `TabPagerDesktopSource`, `TabPagerVirtualDesktopInfo`, or both.

Correct end state: Have one explicit provider boundary. Either collapse `TabPagerVirtualDesktopInfo` into `TaskManagerDesktopSource` and test raw mapping through pure functions, or rename/document it as a narrow LibTaskManager port with no domain responsibility.

Suggested migration: If no second raw provider is planned, remove `TabPagerVirtualDesktopInfo` and rely on mapper tests plus fake `TabPagerDesktopSource` at controller/backend level. If keeping it, rename it to a LibTaskManager-specific port and document that only `TaskManagerDesktopSource` should depend on it.

Acceptance criteria: Adding a non-LibTaskManager source requires implementing one documented interface. Tests still cover raw mapping and signal wiring without duplicating provider concepts.

## Logic Placement and Flow Predictability

### Finding: `sourceState()` logs during a const read

Priority: P2

Evidence: `src/tabpagerdesktopsource.h` defines `sourceState() const` as the state read API; `TaskManagerDesktopSource::sourceState()` maps raw state, calls `logDesktopSourceDiagnostics(result.diagnostics)`, and returns state; `TabPagerDesktopController::reloadSourceState()` calls `m_source->sourceState()`.

Current state: A method shaped as a pure state getter emits warnings when diagnostics change. `TaskManagerDesktopSource::sourceDiagnostics()` exposes the current structured diagnostics through the same mapper path, but it is source-specific and has no generic source/backend observability semantics.

Design concern: This is a hidden side effect in a query path. Callers cannot inspect state through the generic source read without potentially triggering diagnostic logging on diagnostic transitions.

Correct end state: `sourceState()` should be observationally pure. Diagnostic reporting should be explicit and tied to source updates, diagnostic transitions, or an injected diagnostic sink.

Suggested migration: Keep `taskManagerDesktopSourceMappingFromRawState()` as the pure source of state plus diagnostics. Move logging out of `sourceState()` into a diagnostic sink, signal, or cached transition logger.

Acceptance criteria: Diagnostic reporting no longer lives behind a getter-shaped API. Diagnostics are still exposed or emitted when malformed TaskManager state is observed. Tests can assert diagnostic behavior without global Qt message interception.

### Finding: Wheel navigation policy is split between QML and C++ navigator state

Priority: P3

Evidence: `TabPagerView.qml` computes wheel input from `wheel.inverted` and `wheel.angleDelta.y || wheel.angleDelta.x`, then calls `backend.activateByWheelDelta(delta)`; `TabPagerDesktopNavigator::consumeWheelDelta()` accumulates pending wheel delta and converts positive wheel steps into negative desktop offsets; tests verify QML forwarding separately from backend/controller navigation behavior.

Current state: The user-visible rule “scroll up moves to previous, scroll down moves to next” is implemented across QML event normalization, backend forwarding, navigator accumulation, and sign inversion.

Design concern: The semantic direction is not visible at the call boundary. QML owns part of device normalization while `TabPagerDesktopNavigator` owns wheel-device accumulation and sign conversion.

Correct end state: Raw wheel-device handling should be isolated from desktop navigation. The navigator should operate on semantic desktop offsets. A small wheel-input adapter should convert Qt wheel events/deltas into semantic offsets.

Suggested migration: Extract wheel accumulation/sign handling into a `TabPagerWheelNavigation` or `WheelDeltaAccumulator` component that returns semantic offsets. Keep `TabPagerDesktopNavigator::targetForOffset()` as the central desktop navigation rule.

Acceptance criteria: A test verifies full spec mapping for wheel up/down. `TabPagerDesktopNavigator` no longer stores wheel-specific pending state unless it is explicitly the wheel adapter. The sign conversion is named and tested in one place.

### Finding: Parallel navigation APIs obscure the primary abstraction

Priority: P3

Evidence: `TabPagerDesktopNavigator` exposes optional-return wrappers and typed-result methods; the optional methods are thin adapters over result methods; `TabPagerDesktopController` exposes silent methods and `WithResult` variants; silent methods discard result values; private `activateOffset()` is declared and defined but unused except as a wrapper.

Current state: Navigation operations have multiple surfaces: optional target lookup, typed result lookup, silent activation, result activation, and an unused private wrapper.

Design concern: Future navigation changes must preserve several equivalent APIs, and tests can exercise convenience wrappers that production does not use.

Correct end state: Choose one internal result shape for navigation and activation. Production callers can discard results explicitly where appropriate, but tests should assert the same result API production uses.

Suggested migration: Keep `TabPagerDesktopNavigationResult`/`TabPagerActivationResult` as canonical internal APIs. Remove optional navigator wrappers and unused private wrappers.

Acceptance criteria: No navigation method exists solely as a test convenience wrapper. Controller and navigator each expose one clear API per operation. Existing next/previous/wheel behavior remains covered.

## Testability Problems

### Finding: Activation planning requires effectful controller tests

Priority: P2

Evidence: `TabPagerDesktopController::activateWithResult()` delegates direct index classification to `TabPagerActivationPlanner`, then executes any returned desktop activation command through `m_source->activateDesktop()`; navigation result translation also lives in `TabPagerActivationPlanner`; wheel activation still consumes navigator state in the controller and then executes the planned target through the direct activation path; controller and backend tests still use fake `QObject` sources, real model state, signal wiring, and side-effect assertions.

Current state: Navigation target calculation, direct activation result classification, and navigation-result translation are pure. Desktop ID lookup, wheel consumption, source effect execution, and some activation behavior coverage are still bound together in the controller.

Design concern: Direct invalid-index, invalid-ID, valid activation-command planning, and navigation no-op result translation no longer require integration-style fixtures. Behavior tests for wrapping target selection, wheel remainder, source execution, and backend facade reporting still require integration-style fixtures, and backend tests repeat some controller activation scenarios through the facade.

Correct end state: A pure activation planner should return `{result, optional desktopId}` or an activation command from state/navigation input. The controller should synchronize source state, call the planner, log/report no-ops, and execute the returned command.

Suggested migration: Extend `TabPagerActivationPlanner` beyond direct index activation and navigation-result translation so it accepts row IDs/current index/navigation settings and returns a command. Direct result classification and navigation result translation have moved there; remaining work is to move wheel/context activation planning, then reduce controller tests to source synchronization and command execution.

Acceptance criteria: All activation decision cases are testable without `QObject`, `QSignalSpy`, or fake sources. Controller tests only assert wiring, state synchronization, logging/reporting, and source execution.

### Finding: Layout metrics and wheel input mapping are tested through QML integration

Priority: P2

Evidence: `PagerLayoutMetrics.qml` contains deterministic sizing formulas and constants; `tests/tabpagerlayoutmetrics_test.cpp` creates a `QQmlEngine`, sets import paths, and loads QML from `TABPAGER_SOURCE_DIR`; `TabPagerView.qml` computes wheel delta in a `MouseArea`; `tests/tabpagerview_test.cpp` loads the view from the filesystem, creates a `QQuickWindow`, waits for exposure, sends mouse/wheel events, and asserts fake backend calls.

Current state: Pure numeric layout rules and pure wheel-event normalization are mostly tested through QML engine/filesystem/window integration.

Design concern: These tests are slower and more brittle than necessary because they depend on QML import paths, source-tree layout, offscreen window exposure, and KDE/Qt Quick imports.

Correct end state: Pure layout and input mapping should have direct test seams. QML should bind to those seams and keep one smoke/integration test for wiring.

Suggested migration: Introduce a pure layout calculator, either C++ or a small directly testable QML/JS helper. Extract wheel delta normalization into a pure helper. Keep a minimal QML smoke test for binding/event delivery.

Acceptance criteria: Layout and wheel-normalization cases can be tested without `QQmlEngine`, `QUrl::fromLocalFile`, `TABPAGER_SOURCE_DIR`, `QQuickWindow`, or `qWaitForWindowExposed`. One integration smoke test remains.

## Error Handling and Observability Problems

### Finding: Source diagnostics are log-only and not stateful

Priority: P2

Evidence: `TaskManagerDesktopSourceDiagnostic` and `TaskManagerDesktopSourceMappingResult` carry structured diagnostics from the mapper; `TaskManagerDesktopSource::sourceState()` logs diagnostics and returns only `result.state`; `TabPagerDesktopSourceState` contains only desktop snapshot and wrapping policy.

Current state: Malformed TaskManager data is converted into best-effort state. `TaskManagerDesktopSource::sourceDiagnostics()` can inspect the current structured diagnostics directly, but `sourceState()` still emits transition warnings and the diagnostics are not part of generic source/controller/backend state.

Design concern: The backend and UI cannot distinguish healthy state from degraded state without parsing logs. Diagnostics have no lifecycle or recovery signal outside source-local warning suppression.

Correct end state: Source state should include health/degraded status or diagnostics, or diagnostics should be emitted through a dedicated observable channel. Logging should occur on diagnostic transitions, not every read.

Suggested migration: Extend source state with diagnostics/health, or add a diagnostic signal/sink. The source-local warning cache now logs only when diagnostics appear, disappear, or materially change; remaining work should move diagnostic reporting out of the getter-shaped `sourceState()` path.

Acceptance criteria: Backend/QML or tests can inspect source health without parsing logs. Tests cover diagnostic appearance, update, and recovery through an explicit diagnostic channel rather than getter-side log capture.

## Deletion, Modularity, and Abstraction Problems

### Finding: Navigation wrapping leaks through data, controller, backend API, and QML metadata

Priority: P2

Evidence: The spec requires wrapping behavior for scrolling; `navigationWrappingAround` is stored beside desktop snapshot data in `TabPagerDesktopSourceState`; `TaskManagerDesktopSource` maps the TaskManager wrapping signal into generic source state changes; `TabPagerDesktopController` applies wrapping to the navigator; `TabPagerBackend` exposes `navigationWrappingAround` as a QML property; `src/tabpagerplugin.qmltypes` exposes the property; shipped QML only calls `activateByWheelDelta(delta)` and does not read the property.

Current state: A controller-only navigation policy is carried through the desktop data source and public backend API.

Design concern: This makes wrapping hard to remove or replace cleanly. Any change touches LibTaskManager wrapper, mapper, source state, controller, backend API, qmltypes, and tests.

Correct end state: Treat wrapping as navigator/controller policy. Expose it to QML only if QML needs to render or configure it.

Suggested migration: Remove public `navigationWrappingAround` from `TabPagerBackend` and qmltypes if no QML consumer exists. Split source updates into desktop snapshot changes and private navigation-policy changes.

Acceptance criteria: Scrolling still follows KDE wrapping behavior. `TabPagerBackend` no longer exposes wrapping unless there is a QML consumer. Desktop model reloads are not required solely to update navigation policy. Tests verify wrapping through activation outcomes.

### Finding: Presentation formatting ownership is ambiguous

Priority: P2

Evidence: `TabPagerDesktopRowData` includes presentation-facing `label`, `number`, and `active`; `TabPagerDesktopRows` computes label text through `TabPagerDesktopLogic::labelForDesktop()`; `TabPagerBackend` exposes `QFont labelFont`; `TabPagerBackend::labelFont()` returns `QFontDatabase::systemFont(QFontDatabase::FixedFont)`; QML uses the backend font for metrics and rendering.

Current state: C++ row projection owns label text formatting, C++ backend owns font selection, and QML owns layout and rendering.

Design concern: The model layer is partly semantic state and partly a QML view model. That may be acceptable, but the ownership is not explicit, and it pulls presentation concepts into backend/model APIs.

Correct end state: Choose one boundary. Either define `tabpagermodel`/`TabPagerBackend` as a deliberate QML view-model layer owning presentation decisions, or keep core model data semantic and move label/font presentation into a QML-facing presenter/helper.

Suggested migration: Prefer separating semantic desktop data from QML presentation data if more presentation behavior is expected. If C++ should own presentation, rename/document the module as view-model code and keep all QML-facing presentation decisions there.

Acceptance criteria: The ownership rule for label formatting and font selection is explicit. `labelFont` is not mixed into a command-only backend unless that backend is intentionally a view model. Module dependencies reflect the chosen boundary.

## Recommended Correct End-State Architecture

Ownership boundaries: A source adapter boundary ingests external TaskManager/Plasma state and produces desktop state plus explicit diagnostics. A desktop state store owns the current desktop state and transition planning. A Qt model adapts the state store into QML model notifications. A navigation/activation planner owns pure decisions. A controller composes state, navigation settings, and source commands. QML owns rendering and event delivery.

Where domain rules should live: Default-name label behavior should live either in a documented view-model/presentation boundary or in QML presentation helpers, not half in semantic model code and half in backend UI properties. Wrapping behavior should live in navigator/controller policy, not in desktop inventory state.

Where state should be defined: `TabPagerDesktopStateStore` should own current state and transition results. Wheel delta pending state should live in a wheel-input adapter with explicit context scoping. Source diagnostics should be part of source health state or a dedicated diagnostic stream.

Where validation should happen: Public APIs that accept untrusted indexes or IDs should still validate those inputs.

How external effects should be isolated: TaskManager reads and activation requests should remain behind source/provider interfaces. Activation planning should return commands without executing them. The controller should execute commands and report outcomes. QML event handling should convert UI events into semantic inputs through a small tested adapter.

How errors should be represented: Source diagnostics should be structured and observable, not log-only. Activation results should distinguish invalid input, benign no-op, degraded state, request sent, and optionally confirmation/timeout. Fatal programmer errors should fail deterministically with critical diagnostics, not rely only on debug assertions.

How tests should be structured: Keep pure tests for navigation target calculation, wheel delta mapping, activation planning, and layout metrics. Keep focused Qt/QML integration smoke tests for model notifications, QML binding load, and event wiring. Avoid repeating the same activation behavior matrix at controller and backend layers unless each test proves different wiring.

## Suggested Refactoring Sequence

1. Isolate core domain logic from external effects by extracting activation planning and wheel input mapping from `TabPagerDesktopController`/QML event handlers.
2. Clarify ownership boundaries by separating desktop source state from navigation settings and by inserting a small state store between controller logic and the Qt list model.
3. Improve error semantics and observability by making source diagnostics stateful/observable, removing getter-side logging, and clarifying activation request versus confirmation.
4. Remove or simplify premature abstractions by narrowing public QML roles, removing unused/convenience navigation wrappers, and deciding whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a test seam.

## Things Not To Change Yet

Do not rewrite the entire widget into a new architecture. The current code is small enough for incremental seams.

Do not introduce migrations or backward-compatibility layers for pre-release internal formats unless specifically requested.

Do not remove `TabPagerVirtualDesktopInfo` until a replacement test strategy preserves TaskManager signal wiring coverage.

Do not move label formatting to QML just because it is presentation-related. First decide whether the C++ model is intentionally a QML view model.

Do not expose more diagnostics to QML than the UI needs. Make diagnostics structured and testable first; only surface user-facing status when there is a display requirement.

Do not optimize QML layout implementation before centralizing the contract and tests. The current visual behavior should be preserved.

## Appendix: Subagent Reports

Single Source of Truth / Duplication Agent: Reported repeated package identity/module metadata, duplicated navigation no-op result states, and repeated QML layout constants. Package metadata was kept as P2. Navigation no-op enum duplication and layout constants were kept as P3. No findings were rejected.

Invariant / Correctness Agent: Reported uncertain wheel-delta context scoping, kept as P2 uncertain because the spec does not define intended behavior.

Cohesion / Coupling / Ownership Agent: Reported broad controller ownership, source ownership of navigation policy, and split presentation formatting. Controller ownership and navigation policy were kept as P2. Presentation formatting was kept as P2 but framed as a boundary decision rather than a mandatory move to QML.

Logic Placement / Flow Readability Agent: Reported logging from `sourceState()` and split wheel navigation policy. Getter-side logging was merged with observability findings and kept as P2. Wheel flow readability was kept as P3 and linked to the stronger P2 wheel context issue.

Testability Agent: Reported QML-heavy layout tests, Quick-window input dispatch tests, effectful activation-controller tests, and getter-side diagnostic logging. Layout/input testability and activation planning were kept as P2. Getter-side diagnostics were merged into the source diagnostics finding.

Error Handling / Observability Agent: Reported activation success before confirmation, source diagnostics as log-only, and assertion-only fatal invariants. Source diagnostics were kept as P2. Activation confirmation was downgraded from P1 to P2 because the immediate issue is naming unless confirmed activation is surfaced.

Deletion / Modularity / Abstraction Agent: Reported public row roles exposing internal fields, wrapping leaking through public API, parallel navigation APIs, and two LibTaskManager adapter seams. Public row roles and wrapping leakage were kept as P2. Parallel navigation APIs and adapter-seam clarity were kept as P3. No broad rewrite recommendation was accepted.
