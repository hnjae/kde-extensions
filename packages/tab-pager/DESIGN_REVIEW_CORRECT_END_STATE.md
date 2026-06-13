# Design Review: Correct End State

## Executive Summary

The codebase is small and already has useful seams: TaskManager raw-state mapping is mostly pure, navigation target calculation is separated from QML rendering, and the model-state transition code has targeted tests. The main architectural risk is not lack of layering; it is that several important contracts are still implied by convention instead of being owned by a focused boundary.

The highest-impact remaining issue is that orchestration, state synchronization, navigation, and effects converge in `TabPagerDesktopController`. The controller owns the source, subscribes to source/settings changes, writes and reads the state-store port, owns the navigator, consumes wheel deltas, delegates activation planning, logs selected no-ops, and dispatches source activation. That is manageable at the current size, but it is the pressure point where new behavior will become harder to test and reason about.

Operational visibility now has an explicit source/controller health channel. `TaskManagerDesktopSource` keeps structured provider diagnostics for tests and provider-local transition logging, while generic controller code can observe degraded source state without parsing logs or downcasting. User-facing backend/QML diagnostic display remains intentionally absent until there is a concrete display requirement.

No P0 issue was found. The recommended end state is a precise, boring architecture: a small application state store, pure planners for navigation/activation/input mapping, Qt/QML adapters around those seams, and explicit diagnostic/error channels.

## Top Design Risks

1. `TabPagerDesktopController` spans source ownership, source/settings reloads, state-store reads/writes, navigation, wheel consumption, activation-planner delegation, logging, and activation effects.
2. Package identity, version, QML module URI, and install-path metadata are still repeated across build, package, QML, and Nix metadata.

## Single Source of Truth Violations

### Finding: Package identity and module metadata are repeated

Priority: P2

Evidence: `package/metadata.json` defines the package ID and version; `package/contents/ui/main.qml` imports the concrete QML module URI.

Current state: One release/install contract is declared across KPackage metadata, QML imports, CMake, and Nix packaging/check code. CMake and Nix derive package ID, version, and QML module path from `package/metadata.json`; `qmldir` and `src/tabpagerplugin.qmltypes.in` are configured from CMake's derived QML module URI; and metadata drift tests verify the repeated declarations agree.

Design concern: A mismatch can produce a package whose Plasma ID, install destination, QML import URI, qmltypes export, and Nix metadata disagree.

Correct end state: One source should own package identity, version, QML module URI, and module path. Other files should be generated, configured, or checked against it.

Suggested migration: Pick an authority, likely CMake variables or `package/metadata.json`, then generate/configure QML import metadata, package metadata fragments, and Nix check paths from that authority.

Acceptance criteria: Changing package ID or version requires editing one authoritative declaration. CI verifies that `package/metadata.json`, installed plasmoid path, `qmldir`, qmltypes export, and Nix checks agree.

### Finding: Layout constants have local duplicate defaults

Priority: P3

Evidence: `package/contents/ui/PagerLayoutMetrics.qml` defines `desktopGap: 1`; `package/contents/ui/PagerDesktopStrip.qml` also defaults `desktopGap: 1`; `TabPagerView.qml` passes `layoutMetrics.desktopGap` into `PagerDesktopStrip`; `PagerLayoutMetrics.qml` repeats `1` as minimum extent; `PagerDesktopStrip.qml` repeats minimum extent in implicit size clamps and `Layout.minimumWidth: 1`; `tests/tabpagerlayoutmetrics_test.cpp` repeats `fillMinimumExtent = 1.0`.

Current state: `PagerLayoutMetrics` is effectively the production owner when assembled, but child components still carry independent defaults and repeated literals.

Design concern: If KDE pager spacing or minimum extent rules change, several QML components and tests need synchronized edits.

Correct end state: Layout constants should be owned by one layout metrics component or constants object. Consumers should receive values explicitly.

Suggested migration: Make `PagerDesktopStrip.desktopGap` required. Introduce named constants for minimum extent and unset preferred extent at the layout-metrics layer.

Acceptance criteria: `desktopGap` has one production definition. Minimum extent literals are named at the owner. Tests assert behavior through the owner rather than child defaults.

## Cohesion, Coupling, and Ownership Problems

### Finding: `TabPagerDesktopController` owns too many responsibilities

Priority: P2

Evidence: `src/tabpagerdesktopcontroller.h` depends on `TabPagerDesktopStateStore` rather than `TabPagerDesktopModel`, accepts `std::unique_ptr<TabPagerDesktopSource>`, `std::unique_ptr<TabPagerNavigationSettingsSource>`, and a non-owning state-store reference; `src/tabpagerdesktopcontroller.cpp` connects source/settings changes, reloads source state, mutates the state store with `setDesktopSnapshot()`, reads desktop IDs/current index/count through the state store, owns the navigator, calls the activation planner, logs no-ops, and calls source activation.

Current state: The controller is source owner, source subscriber, source/settings reloader, state-store writer/reader, navigation coordinator, wheel consumer, activation planner caller, logger, and effect dispatcher. It no longer depends directly on `TabPagerDesktopModel`; Qt model notification semantics are isolated behind the state-store implementation.

Design concern: The controller no longer couples directly to the Qt list model, but it still combines source ownership, source synchronization, navigation coordination, wheel consumption, planner delegation, logging, and effect dispatch.

Correct end state: The controller should remain isolated from the `QAbstractListModel` implementation and should become mostly orchestration: synchronize source/settings state, call pure planners, report outcomes, and execute returned source commands. The Qt model should continue adapting state transitions into `beginResetModel()`, `endResetModel()`, and `dataChanged()` notifications.

Suggested migration: Continue moving decision logic toward pure planners and keep Qt model notification semantics isolated in `TabPagerDesktopModel`. Evaluate whether the state-store transition ownership should move out of the Qt model if more non-QML state consumers appear.

Acceptance criteria: Controller tests focus on state/settings synchronization, planner delegation, outcome reporting, logging, and source command execution. Qt model notification semantics stay inside `TabPagerDesktopModel`.

### Finding: Two adapter seams wrap the same LibTaskManager dependency

Priority: P3

Evidence: `TabPagerVirtualDesktopInfo` abstracts LibTaskManager-style getters and signals; its only production implementation forwards one-to-one to `TaskManager::VirtualDesktopInfo`; `TaskManagerDesktopSource` is a second adapter that owns `std::unique_ptr<TabPagerVirtualDesktopInfo>`; the only non-production `TabPagerVirtualDesktopInfo` implementation is the source test fake.

Current state: There is a domain source abstraction (`TabPagerDesktopSource`) and a lower-level virtual desktop info abstraction (`TabPagerVirtualDesktopInfo`). The lower-level abstraction mainly supports source tests.

Design concern: The provider boundary is unclear. A future source provider must choose whether to implement `TabPagerDesktopSource`, `TabPagerVirtualDesktopInfo`, or both.

Correct end state: Have one explicit provider boundary. Either collapse `TabPagerVirtualDesktopInfo` into `TaskManagerDesktopSource` and test raw mapping through pure functions, or rename/document it as a narrow LibTaskManager port with no domain responsibility.

Suggested migration: If no second raw provider is planned, remove `TabPagerVirtualDesktopInfo` and rely on mapper tests plus fake `TabPagerDesktopSource` at controller/backend level. If keeping it, rename it to a LibTaskManager-specific port and document that only `TaskManagerDesktopSource` should depend on it.

Acceptance criteria: Adding a non-LibTaskManager source requires implementing one documented interface. Tests still cover raw mapping and signal wiring without duplicating provider concepts.

## Testability Problems

### Finding: Wheel activation still requires effectful controller tests

Priority: P2

Evidence: `TabPagerDesktopController::activateWithResult()` delegates direct index classification to `TabPagerActivationPlanner`, then executes any returned desktop activation command through `m_source->activateDesktop()`; navigation result translation and navigation-target desktop command planning also live in `TabPagerActivationPlanner`; wheel activation consumes `TabPagerWheelNavigation` state in the controller, resolves the returned semantic offset through `TabPagerDesktopNavigator`, and passes that navigation result plus a state-store desktop ID lookup into the planner; controller and backend tests still use fake `QObject` sources, signal wiring, and side-effect assertions.

Current state: Navigation target calculation, wheel accumulation/sign conversion, direct activation result classification, navigation-result translation, and navigation-target desktop command planning are pure. Desktop ID lookup, helper composition, source effect execution, and some activation behavior coverage are still bound together in the controller.

Design concern: Direct invalid-index, invalid-ID, valid activation-command planning, navigation no-op result translation, navigation target desktop-command planning, wrapping target selection, and wheel remainder handling no longer require integration-style fixtures. Source execution and backend facade reporting still require integration-style fixtures, and backend tests repeat some controller activation scenarios through the facade.

Correct end state: Wheel-device accumulation and semantic navigation target selection should be testable without source effects. The activation planner should continue returning activation commands from resolved state/navigation input, and the controller should synchronize source state, call pure helpers, log/report no-ops, and execute returned commands.

Suggested migration: Keep wheel activation routed through independently tested semantic offsets and navigation results. Keep `TabPagerActivationPlanner` focused on converting resolved IDs/navigation results into activation plans, then reduce controller tests to source synchronization, helper delegation, logging/reporting, and source command execution.

Acceptance criteria: Wheel accumulation, sign conversion, navigation target selection, and activation planning are testable without `QObject`, `QSignalSpy`, or fake sources. Controller tests only assert wiring, state synchronization, helper delegation, logging/reporting, and source execution.

## Recommended Correct End-State Architecture

Ownership boundaries: A source adapter boundary ingests external TaskManager/Plasma state and produces desktop state plus explicit diagnostics. A desktop state store owns the current desktop state and transition planning. A Qt model and backend form an intentional QML view-model boundary that owns row projection, label formatting, QML roles, model notifications, facade properties, and the fixed-width label font. Navigation, activation, and wheel-input helpers own pure decisions. A controller composes state, navigation settings, and source commands. QML owns rendering and event delivery.

Where domain rules should live: Default-name label behavior belongs to the documented QML view-model boundary, not to source-state normalization. Wrapping behavior should live in navigator/controller policy, not in desktop inventory state.

Where state should be defined: `TabPagerDesktopStateStore` should own current desktop state and transition results. `TabPagerWheelNavigation` should preserve the specified pending wheel-delta accumulation contract unless the spec changes first. Source diagnostics should remain observable through the generic source/controller health channel.

Where validation should happen: Public APIs that accept untrusted indexes or IDs should still validate those inputs.

How external effects should be isolated: TaskManager reads and activation requests should remain behind source/provider interfaces. Activation planning should return commands without executing them. The controller should execute commands and report outcomes. QML event handling should convert UI events into backend inputs through small tested adapters, while semantic desktop navigation remains in pure C++ helpers.

How errors should be represented: Source diagnostics should stay structured and observable, not log-only. Provider-specific diagnostic details can remain provider-local until there is a user-facing display requirement, but controller-level health should remain available through the generic source boundary. Activation results should distinguish invalid input, benign no-op, degraded state, request sent, and optionally confirmation/timeout. Fatal programmer errors should fail deterministically with critical diagnostics, not rely only on debug assertions.

How tests should be structured: Keep pure tests for navigation target calculation, wheel delta mapping, activation planning, and layout metrics. Keep focused Qt/QML integration smoke tests for model notifications, QML binding load, and event wiring. Avoid repeating the same activation behavior matrix at controller and backend layers unless each test proves different wiring.

## Suggested Refactoring Sequence

1. Clarify the remaining ownership boundary for whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.
2. Improve error semantics by clarifying activation request versus confirmation.
3. Remove or simplify remaining premature abstractions by narrowing public QML roles if they are not part of the chosen view-model boundary.

## Things Not To Change Yet

Do not rewrite the entire widget into a new architecture. The current code is small enough for incremental seams.

Do not introduce migrations or backward-compatibility layers for pre-release internal formats unless specifically requested.

Do not remove `TabPagerVirtualDesktopInfo` until a replacement test strategy preserves TaskManager signal wiring coverage.

Do not move label formatting to QML just because it is presentation-related. The current C++ backend/model stack is an intentional QML view-model boundary.

Do not expose more diagnostics to QML than the UI needs. Make diagnostics structured and testable first; only surface user-facing status when there is a display requirement.

Do not optimize QML layout implementation before centralizing the contract and tests. The current visual behavior should be preserved.

## Appendix: Subagent Reports

Single Source of Truth / Duplication Agent: Reported repeated package identity/module metadata, duplicated navigation no-op result states, and repeated QML layout constants. Package metadata was kept as P2. Layout constants were kept as P3. Navigation no-op enum duplication was dropped because the typed navigation and activation result APIs are now the canonical internal shapes.

Invariant / Correctness Agent: Reported uncertain wheel-delta context scoping. The spec now defines the current behavior: partial wheel input persists across navigation context changes and completed stopped-at-edge steps are consumed.

Cohesion / Coupling / Ownership Agent: Reported broad controller ownership, source ownership of navigation policy, and split presentation formatting. Controller ownership remains P2, but the source/navigation policy finding was removed because desktop source state and navigation settings are now separated and tested. Presentation formatting is now documented as part of the intentional QML view-model boundary.

Logic Placement / Flow Readability Agent: Reported logging from `sourceState()` and split wheel navigation policy. Getter-side logging has been removed from `sourceState()`, and source/controller diagnostics health is now observable through a generic source boundary. Wheel input normalization, pending wheel state, sign conversion, and semantic navigation now have named boundaries.

Testability Agent: Reported QML-heavy layout tests, Quick-window input dispatch tests, effectful activation-controller tests, and getter-side diagnostic logging. Layout metrics and wheel input normalization now have direct tests without QML-engine or Quick-window event dispatch. Wheel activation testability remains P2. Getter-side diagnostics were resolved by the generic source/controller diagnostics channel.

Error Handling / Observability Agent: Reported activation success before confirmation, source diagnostics as log-only, and assertion-only fatal invariants. Source diagnostics now have generic source/controller health observability while provider-specific details remain provider-local. Activation confirmation was downgraded from P1 to P2 because the immediate issue is naming unless confirmed activation is surfaced.

Deletion / Modularity / Abstraction Agent: Reported public row roles exposing internal fields, wrapping leaking through public API, parallel navigation APIs, and two LibTaskManager adapter seams. Public row roles were narrowed and the remaining row projection is documented as an intentional QML view-model boundary. Wrapping leakage was removed because wrapping is no longer public backend/QML API and no longer reloads desktop source state. Parallel navigation APIs were removed because optional/test-only wrappers are gone; the remaining silent commands are QML-facing entry points over result-returning internals. Adapter-seam clarity remains P3.
