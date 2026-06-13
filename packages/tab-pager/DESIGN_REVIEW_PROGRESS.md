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

## Remaining Follow-Up Work

- P2 controller orchestration, state-store separation, navigation settings separation, source diagnostics observability, activation planning, wheel context scoping, and assertion-only fatal invariants remain open.
- P2/P3 API cleanup items remain open: public model role narrowing, wrapping API leakage, wheel input adapter extraction, parallel navigation API cleanup, layout constant consolidation, package metadata de-duplication, and `TabPagerVirtualDesktopInfo` boundary clarification.

## Deviations

- This checkpoint did not broaden into controller/state-store refactoring; the design review explicitly calls for incremental seams, and the normalized snapshot boundary was the highest-priority safe P1 change.
- The Nix CTest wrapper failed during Nix evaluation after the focused targets had built successfully; direct CTest runs against the same build tree were used as verification for this checkpoint.
- The current target document has no remaining P0/P1 findings, so this checkpoint addressed the smallest remaining P2 item with direct proof instead of inventing a higher-priority task.
