<!--
SPDX-FileCopyrightText: 2026 KIM Hyunjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Design Review Progress

## Completed Checkpoints

- P1 normalized desktop snapshot boundary: added `TabPagerDesktopSnapshot` construction through normalization, added normalization issues for invalid IDs, duplicate IDs, and unmatched current desktops, translated those issues in the TaskManager adapter, and changed row/model projection to consume normalized snapshots instead of silently filtering invalid IDs.
- P1 QML type metadata drift check: added a CTest coverage seam that compares the registered `TabPagerBackend` export and QML-visible properties, invokables, and signals against `src/tabpagerplugin.qmltypes`.
- P2 row diff identity precondition: changed row diff planning to return an explicit incompatible-identity result, made row identity comparison private to the row collection, and kept model-state transitions responsible for converting incompatible identity into reset transitions.

## Verification

- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerdesktop|tabpagerdesktoprows|tabpagerdesktopmodelstate|taskmanagerdesktopsource|tabpagerbackend)$'`
- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerqmltypes|tabpagerbackend)$'`
- `nix develop path:../..#default -c tab-pager-lint-qml`
- `nix develop path:../..#default -c cmake --build build`
- `nix develop path:../..#default -c ctest --test-dir build --output-on-failure -R '^(tabpagerdesktoprows|tabpagerdesktopmodelstate|tabpagerdesktopmodel|tabpagerdesktopcontroller|tabpagerbackend)$'`

## Remaining Follow-Up Work

- P2 controller orchestration, state-store separation, navigation settings separation, source diagnostics observability, activation planning, wheel context scoping, public activation no-op observability, and assertion-only fatal invariants remain open.
- P2/P3 API cleanup items remain open: public model role narrowing, wrapping API leakage, wheel input adapter extraction, parallel navigation API cleanup, layout constant consolidation, package metadata de-duplication, and `TabPagerVirtualDesktopInfo` boundary clarification.

## Deviations

- This checkpoint did not broaden into controller/state-store refactoring; the design review explicitly calls for incremental seams, and the normalized snapshot boundary was the highest-priority safe P1 change.
