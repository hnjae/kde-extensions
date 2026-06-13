<!--
SPDX-FileCopyrightText: 2026 KIM Hyunjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Design Review Progress

## Completed Checkpoints

- P1 normalized desktop snapshot boundary: added `TabPagerDesktopSnapshot` construction through normalization, added normalization issues for invalid IDs, duplicate IDs, and unmatched current desktops, translated those issues in the TaskManager adapter, and changed row/model projection to consume normalized snapshots instead of silently filtering invalid IDs.
- P1 QML type metadata drift check: added a CTest coverage seam that compares the registered `TabPagerBackend` export and QML-visible properties, invokables, and signals against `src/tabpagerplugin.qmltypes`.
- P2 row diff identity precondition: changed row diff planning to return an explicit incompatible-identity result, made row identity comparison private to the row collection, and kept model-state transitions responsible for converting incompatible identity into reset transitions.
- P2 public activation result observability: added backend-facing activation result reporting for direct, relative, and wheel activation requests while preserving the existing void QML invokables and activation side effects; public result names distinguish activation request dispatch from invalid input, degraded current-desktop state, edge stops, and partial wheel input.
- P2 activation request naming: renamed the internal successful activation result from `Activated` to `ActivationRequested`, preserving activation side effects and the existing backend-facing `"ActivationRequested"` signal payload. Files changed: `src/tabpagerdesktopcontroller.h`, `src/tabpagerdesktopcontroller.cpp`, `src/tabpagerbackend.cpp`, `tests/tabpagerdesktopcontroller_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 deterministic fatal invariant handling: replaced assertion-only guards for null `TaskManagerDesktopSource` info, null `TabPagerDesktopController` source, and mismatched `TabPagerPlugin` QML URI with runtime `qFatal` diagnostics while preserving valid-path behavior. Files changed: `src/taskmanagerdesktopsource.cpp`, `src/tabpagerdesktopcontroller.cpp`, `src/tabpagerplugin.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 wheel pending-delta characterization: added navigator tests that prove the current pending wheel delta is preserved across no-current context, current-desktop changes, desktop-count changes, wrapping changes, and that a completed wheel step stopped at a non-wrapping edge is consumed. Files changed: `tests/tabpagerdesktopnavigator_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 structured source diagnostics read seam: added `TaskManagerDesktopSource::sourceDiagnostics()` using the same mapper path as `sourceState()`, with source tests proving malformed current TaskManager data can be inspected as structured diagnostics without parsing logs. Files changed: `src/taskmanagerdesktopsource.h`, `src/taskmanagerdesktopsource.cpp`, `tests/taskmanagerdesktopsource_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 QML role exposure characterization: added a view-level test proving shipped QML still loads with a model exposing only `label` and `active`, while existing backend/row tests continue to lock the current broader backend model roles. Files changed: `tests/tabpagerview_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 source diagnostic transition logging: cached the last logged `TaskManagerDesktopSource` diagnostic set so unchanged repeated `sourceState()` reads do not duplicate warnings, while diagnostic changes and recovery/reappearance remain observable. Files changed: `src/taskmanagerdesktopsource.h`, `src/taskmanagerdesktopsource.cpp`, `tests/taskmanagerdesktopsource_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 direct activation planner seam: added `TabPagerActivationPlanner` for pure direct index activation classification and command creation, then changed `TabPagerDesktopController::activateWithResult()` to execute the planner command instead of owning invalid-index/invalid-ID classification inline. Files changed: `CMakeLists.txt`, `src/tabpageractivationplanner.h`, `src/tabpageractivationplanner.cpp`, `src/tabpagerdesktopcontroller.h`, `src/tabpagerdesktopcontroller.cpp`, `tests/tabpageractivationplanner_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 navigation activation planner seam: extended `TabPagerActivationPlanner` to translate `TabPagerDesktopNavigationResult` into activation plans, then changed `TabPagerDesktopController::activateNavigationTarget()` to delegate no-op result translation while still executing target indexes through the existing direct activation path. Files changed: `src/tabpageractivationplanner.h`, `src/tabpageractivationplanner.cpp`, `src/tabpagerdesktopcontroller.cpp`, `tests/tabpageractivationplanner_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 public model role narrowing: narrowed `TabPagerDesktopModel`'s public role table to `label` and `active`, while keeping `desktopId`, `name`, and `number` in internal row state for activation lookup, label generation, and row-state tests. Files changed: `src/tabpagerdesktoprow.cpp`, `tests/tabpagerdesktoprow_test.cpp`, `tests/tabpagerdesktopmodel_test.cpp`, `tests/tabpagerbackend_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 public wrapping API removal: removed `navigationWrappingAround` from `TabPagerBackend` and `src/tabpagerplugin.qmltypes`, keeping wrapping behavior internal to the controller/source path and verified through activation outcomes. Files changed: `src/tabpagerbackend.h`, `src/tabpagerbackend.cpp`, `src/tabpagerplugin.qmltypes`, `tests/tabpagerbackend_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P2 package metadata drift check: added `tabpagermetadata` CTest coverage verifying CMake identity values agree with `package/metadata.json`, `src/qmldir`, `src/tabpagerplugin.qmltypes`, Nix package metadata, Nix check paths, and CMake install destinations. Files changed: `CMakeLists.txt`, `tests/tabpagermetadata_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P3 navigation API cleanup: removed optional-return `TabPagerDesktopNavigator` convenience wrappers and the unused private `TabPagerDesktopController::activateOffset()` wrapper, keeping typed navigation/activation results as the canonical internal APIs and updating navigator tests to exercise those result APIs directly. Files changed: `src/tabpagerdesktopnavigator.h`, `src/tabpagerdesktopnavigator.cpp`, `src/tabpagerdesktopcontroller.h`, `src/tabpagerdesktopcontroller.cpp`, `tests/tabpagerdesktopnavigator_test.cpp`, `DESIGN_REVIEW_PROGRESS.md`, and `DESIGN_REVIEW_CORRECT_END_STATE.md`.

## Verification

- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerdesktop|tabpagerdesktoprows|tabpagerdesktopmodelstate|taskmanagerdesktopsource|tabpagerbackend)$'`
- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerqmltypes|tabpagerbackend)$'`
- `nix develop path:../..#default -c tab-pager-lint-qml`
- `nix develop path:../..#default -c cmake --build build`
- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprows|tabpagerdesktopmodelstate|tabpagerdesktopmodel|tabpagerdesktopcontroller|tabpagerbackend)$'`
- `nix develop path:../..#default -c cmake --build build --target tabpagerbackend_test tabpagerqmltypes_test` passed.
- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerbackend|tabpagerqmltypes)$'` failed before running tests because Nix evaluation could not find `lib/deprecated/misc.nix` in a pinned `DeterminateSystems/nixpkgs-weekly` source path.
- `ctest --test-dir build --output-on-failure -R '^(tabpagerbackend|tabpagerqmltypes)$'` passed.
- `ctest --test-dir build --output-on-failure -R '^(tabpagerdesktopcontroller|tabpagerbackend|tabpagerqmltypes)$'` passed.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerbackend_test tabpagerqmltypes_test && ctest --test-dir build --output-on-failure` passed after `treefmt` reformatted touched C++ files during the first commit attempt.
- `cmake --build build --target tabpagerdesktopcontroller_test tabpagerbackend_test` passed.
- `ctest --test-dir build --output-on-failure -R '^(tabpagerdesktopcontroller|tabpagerbackend)$'` passed.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target taskmanagerdesktopsource_test tabpagerdesktopcontroller_test tabpagerqmltypes_test tabpagerbackend_test` passed.
- `ctest --test-dir build --output-on-failure -R '^(taskmanagerdesktopsource|tabpagerdesktopcontroller|tabpagerqmltypes|tabpagerbackend)$'` passed.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerdesktopnavigator_test` passed.
- `ctest --test-dir build --output-on-failure -R '^tabpagerdesktopnavigator$'` passed.
- `just format` passed and reformatted `tests/tabpagerdesktopnavigator_test.cpp`.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target taskmanagerdesktopsource_test` failed as expected before implementation because `TaskManagerDesktopSource` had no `sourceDiagnostics()` member.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure -R '^taskmanagerdesktopsource$'` passed.
- `ctest --test-dir build --output-on-failure` passed.
- `just format` passed and reformatted touched C++ files.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerview_test` passed.
- `ctest --test-dir build --output-on-failure -R '^(tabpagerview|tabpagerbackend|tabpagerdesktoprow)$'` passed.
- `just format` passed and reported one formatted file with no content changes.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure -R '^taskmanagerdesktopsource$'` failed as expected before implementation: `doesNotRepeatUnchangedSourceDiagnosticsOnRepeatedStateReads()` observed 2 warnings instead of 1.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure -R '^taskmanagerdesktopsource$'` passed after implementation.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure -R '^taskmanagerdesktopsource$'` passed after adding diagnostic change/recovery coverage.
- `just format` passed and reformatted one touched file.
- `cmake --build build --target taskmanagerdesktopsource_test && ctest --test-dir build --output-on-failure -R '^taskmanagerdesktopsource$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpageractivationplanner_test && ctest --test-dir build --output-on-failure -R '^tabpageractivationplanner$'` passed after adding the pure planner seam, before controller integration; the initial build emitted missing designated-initializer warnings that were fixed before final verification.
- `cmake --build build --target tabpageractivationplanner_test tabpagerdesktopcontroller_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpageractivationplanner|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after controller integration.
- `just format` passed and reformatted two touched files.
- `cmake --build build --target tabpageractivationplanner_test tabpagerdesktopcontroller_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpageractivationplanner|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^tabpagerbackend$'` failed as expected before implementation because `navigationWrappingAround` was still exposed as a backend property.
- `cmake --build build --target tabpagerbackend_test tabpagerqmltypes_test tabpagerdesktopcontroller_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerbackend|tabpagerqmltypes|tabpagerdesktopcontroller|tabpagerview)$'` failed once after implementation because one backend test still called the removed getter in a general state assertion.
- `cmake --build build --target tabpagerbackend_test tabpagerqmltypes_test tabpagerdesktopcontroller_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerbackend|tabpagerqmltypes|tabpagerdesktopcontroller|tabpagerview)$'` passed after removing that stale test assertion.
- `just format` passed and reformatted one touched file.
- `cmake --build build --target tabpagerbackend_test tabpagerqmltypes_test tabpagerdesktopcontroller_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerbackend|tabpagerqmltypes|tabpagerdesktopcontroller|tabpagerview)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R '^tabpagermetadata$'` passed after adding the metadata agreement check.
- `cmake --build build --target tabpagermetadata_test tabpagerqmltypes_test && ctest --test-dir build --output-on-failure -R '^(tabpagermetadata|tabpagerqmltypes)$'` passed.
- `just format` passed and reformatted `tests/tabpagermetadata_test.cpp`.
- `cmake --build build --target tabpagermetadata_test tabpagerqmltypes_test && ctest --test-dir build --output-on-failure -R '^(tabpagermetadata|tabpagerqmltypes)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R '^tabpagermetadata$'` passed after adding install-path assertions.
- `just format` passed and reformatted `tests/tabpagermetadata_test.cpp`.
- `cmake --build build --target tabpagermetadata_test tabpagerqmltypes_test && ctest --test-dir build --output-on-failure -R '^(tabpagermetadata|tabpagerqmltypes)$'` passed after final formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerdesktopnavigator_test tabpagerdesktopcontroller_test tabpagerbackend_test` passed after removing navigation convenience wrappers.
- `ctest --test-dir build --output-on-failure -R '^(tabpagerdesktopnavigator|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after removing navigation convenience wrappers.
- `just format` passed and reformatted `tests/tabpagerdesktopnavigator_test.cpp`.
- `cmake --build build --target tabpagerdesktopnavigator_test tabpagerdesktopcontroller_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpagerdesktopnavigator|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpagerdesktoprow_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprow|tabpagerbackend)$'` failed as expected before implementation because `desktopId`, `name`, and `number` were still exposed through `roleNames()`, `data()`, and `dataChanged()` role lists.
- `cmake --build build --target tabpagerdesktoprow_test tabpagerdesktopmodel_test tabpagerdesktopcontroller_test tabpagerbackend_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprow|tabpagerdesktopmodel|tabpagerdesktopcontroller|tabpagerbackend|tabpagerview)$'` failed once after implementation because `tabpagerdesktopmodel_test` still expected the old public `name` role in an update emission.
- `cmake --build build --target tabpagerdesktoprow_test tabpagerdesktopmodel_test tabpagerdesktopcontroller_test tabpagerbackend_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprow|tabpagerdesktopmodel|tabpagerdesktopcontroller|tabpagerbackend|tabpagerview)$'` passed after updating the model expectation.
- `just format` passed with no file changes.
- `cmake --build build --target tabpagerdesktoprow_test tabpagerdesktopmodel_test tabpagerdesktopcontroller_test tabpagerbackend_test tabpagerview_test && ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprow|tabpagerdesktopmodel|tabpagerdesktopcontroller|tabpagerbackend|tabpagerview)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.
- `cmake --build build --target tabpageractivationplanner_test` failed as expected before implementation because `TabPagerActivationPlan` had no `targetIndex`, `TabPagerDesktopNavigationResult` was not visible to the planner, and `tabPagerActivationPlanForNavigationResult()` did not exist.
- `cmake --build build --target tabpageractivationplanner_test && ctest --test-dir build --output-on-failure -R '^tabpageractivationplanner$'` passed after adding pure navigation-result translation.
- `cmake --build build --target tabpageractivationplanner_test tabpagerdesktopcontroller_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpageractivationplanner|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after controller integration.
- `just format` passed and reformatted one touched file.
- `cmake --build build --target tabpageractivationplanner_test tabpagerdesktopcontroller_test tabpagerbackend_test && ctest --test-dir build --output-on-failure -R '^(tabpageractivationplanner|tabpagerdesktopcontroller|tabpagerbackend)$'` passed after formatting.
- `ctest --test-dir build --output-on-failure` passed.

## Remaining Follow-Up Work

- P2 controller orchestration, state-store separation, navigation settings separation, source diagnostics observability, activation planning, and wheel context scoping remain open.
- Source diagnostics are now directly readable from `TaskManagerDesktopSource`, and unchanged repeated diagnostic reads no longer duplicate warnings, but the generic `TabPagerDesktopSource` contract, controller/backend state, explicit diagnostic channel, and getter-side logging cleanup remain open.
- Direct activation result classification and navigation-result translation are now pure, but wheel/context activation planning, controller dependency on the Qt model, and controller/backend integration-style activation coverage remain open.
- Wheel context scoping is now characterized but not resolved; a future checkpoint still needs to decide whether preserving pending wheel deltas across navigation context changes is intended or should be replaced with explicit reset/drop behavior.
- Wrapping no longer leaks through the public backend/QML API, but source-state/navigation-setting separation remains open.
- Package identity metadata is now checked for drift, but changing package identity or version still requires editing repeated declarations instead of one authoritative source.
- P2/P3 API cleanup items remain open: wheel input adapter extraction, layout constant consolidation, package metadata de-duplication, and `TabPagerVirtualDesktopInfo` boundary clarification.

## Deviations

- This checkpoint did not broaden into controller/state-store refactoring; the design review explicitly calls for incremental seams, and the normalized snapshot boundary was the highest-priority safe P1 change.
- The Nix CTest wrapper failed during Nix evaluation after the focused targets had built successfully; direct CTest runs against the same build tree were used as verification for this checkpoint.
- The current target document has no remaining P0/P1 findings, so this checkpoint addressed the smallest remaining P2 item with direct proof instead of inventing a higher-priority task.
- This checkpoint did not add subprocess death tests for fatal paths because the current Qt test harness has no existing crash-test seam; valid-path regression coverage was run, and the fatal branches are direct runtime guards before dereference or QML registration.
- This checkpoint intentionally did not change wheel behavior because the design review marks context scoping as uncertain; it records the current behavior so a later behavior change can be deliberate and reviewable.
- This checkpoint intentionally did not remove diagnostic logging from `sourceState()` or add a generic source diagnostic signal; it only creates a structured read seam that later lifecycle/logging work can use.
- This checkpoint intentionally used Qt message-handler capture to prove the existing log behavior because no explicit diagnostic sink or signal exists yet; the target document still keeps the requirement for future diagnostic tests without global Qt message interception.
- The direct activation planner checkpoint intentionally limited extraction to direct index activation; navigation-result translation was handled by a later checkpoint, while wheel/context activation planning remains open.
- This checkpoint intentionally moved only navigation-result translation, not wheel accumulation or navigation target calculation; those remain separate pending seams because the design review treats wheel context scoping as uncertain.
