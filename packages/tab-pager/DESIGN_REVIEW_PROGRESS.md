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

## Remaining Follow-Up Work

- P2 controller orchestration, state-store separation, navigation settings separation, source diagnostics observability, activation planning, and wheel context scoping remain open.
- Source diagnostics are now directly readable from `TaskManagerDesktopSource`, but the generic `TabPagerDesktopSource` contract, controller/backend state, diagnostic lifecycle, and getter-side logging cleanup remain open.
- Wheel context scoping is now characterized but not resolved; a future checkpoint still needs to decide whether preserving pending wheel deltas across navigation context changes is intended or should be replaced with explicit reset/drop behavior.
- QML role exposure is now characterized but not narrowed; a future checkpoint still needs to decide whether the backend model is an intentional public view model or whether `desktopId`, `name`, and `number` should become internal-only fields.
- P2/P3 API cleanup items remain open: public model role narrowing, wrapping API leakage, wheel input adapter extraction, parallel navigation API cleanup, layout constant consolidation, package metadata de-duplication, and `TabPagerVirtualDesktopInfo` boundary clarification.

## Deviations

- This checkpoint did not broaden into controller/state-store refactoring; the design review explicitly calls for incremental seams, and the normalized snapshot boundary was the highest-priority safe P1 change.
- The Nix CTest wrapper failed during Nix evaluation after the focused targets had built successfully; direct CTest runs against the same build tree were used as verification for this checkpoint.
- The current target document has no remaining P0/P1 findings, so this checkpoint addressed the smallest remaining P2 item with direct proof instead of inventing a higher-priority task.
- This checkpoint did not add subprocess death tests for fatal paths because the current Qt test harness has no existing crash-test seam; valid-path regression coverage was run, and the fatal branches are direct runtime guards before dereference or QML registration.
- This checkpoint intentionally did not change wheel behavior because the design review marks context scoping as uncertain; it records the current behavior so a later behavior change can be deliberate and reviewable.
- This checkpoint intentionally did not remove diagnostic logging from `sourceState()` or add a generic source diagnostic signal; it only creates a structured read seam that later lifecycle/logging work can use.
- This checkpoint intentionally did not narrow backend model roles; it only records the current split between the broader backend role contract and the smaller shipped-QML role requirement.
