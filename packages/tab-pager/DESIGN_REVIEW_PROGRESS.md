<!--
SPDX-FileCopyrightText: 2026 KIM Hyunjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Design Review Progress

## Current State

- `DESIGN_REVIEW_CORRECT_END_STATE.md` is the authoritative document for remaining design risks.
- No P0/P1 design-review findings remain.
- This file is a handoff status summary. Keep the latest checkpoint evidence here; use git history for exact historical diffs and older command output.

## Completed

- Normalized desktop snapshots are the boundary for row/model projection, including invalid-ID, duplicate-ID, and unmatched-current-desktop handling.
- QML type metadata drift and package metadata drift are covered by CTest checks.
- Backend activation result reporting is public, uses `ActivationRequested` for dispatched requests, and distinguishes invalid input, missing current desktop, edge stops, and partial wheel input.
- Fatal constructor/plugin invariants use runtime `qFatal` diagnostics rather than assertion-only guards.
- Wheel pending-delta behavior is characterized across current-desktop changes, desktop-count changes, wrapping changes, no-current contexts, and non-wrapping edge stops.
- The interaction spec defines pending wheel-delta behavior across current-desktop changes, desktop-count changes, wrapping changes, no-current contexts, and non-wrapping edge stops.
- `TaskManagerDesktopSource::sourceDiagnostics()` exposes structured diagnostics without parsing logs.
- Repeated unchanged `TaskManagerDesktopSource::sourceState()` diagnostic reads no longer duplicate warning logs.
- `TaskManagerDesktopSource::sourceState()` is observationally pure; TaskManager diagnostics are logged from explicit source diagnostic transitions instead of getter-shaped reads.
- Generic source diagnostics health is observable through `TabPagerDesktopSource::sourceHasDiagnostics()`, `sourceDiagnosticsChanged()`, and `TabPagerDesktopController` forwarding; controller tests can inspect degraded source health without TaskManager downcasts or log parsing.
- `TabPagerActivationPlanner` covers direct index activation, navigation-result translation, and navigation-target command planning.
- Public desktop model roles are narrowed to `label` and `active`; broader row data remains internal.
- Navigation wrapping is internal to controller/navigation settings behavior, not public backend/QML API, desktop snapshot state, or desktop source state.
- `TabPagerNavigationSettingsSource` separates navigation policy from desktop inventory state.
- `TabPagerDesktopController` depends on `TabPagerDesktopStateStore`, not `TabPagerDesktopModel`; controller tests can use a fake state store.
- Optional/test-only navigation convenience wrappers were removed; typed navigation/activation results are the canonical internal APIs.
- `TabPagerBackend`, `TabPagerDesktopModel`, and row projection are documented as an intentional QML view-model boundary owning label formatting and `labelFont`.
- Row/model-state tests now expect only public `label` and `active` role updates after the desktop model role narrowing.
- Wheel accumulation and sign conversion now live in `TabPagerWheelNavigation`; `TabPagerDesktopNavigator` owns only semantic offset target selection and wrapping policy.

## Remaining

- Extract QML wheel-event normalization into a direct test seam if the dedicated wheel adapter remains the desired end state.
- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Deduplicate package identity, version, QML module URI, and install-path metadata beyond the current drift tests.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: isolated wheel accumulation and sign conversion from `TabPagerDesktopNavigator` into `TabPagerWheelNavigation`.
- Files changed: `CMakeLists.txt`, `src/tabpagerwheelnavigation.h`, `src/tabpagerwheelnavigation.cpp`, `src/tabpagerdesktopnavigator.h`, `src/tabpagerdesktopnavigator.cpp`, `src/tabpagerdesktopcontroller.h`, `src/tabpagerdesktopcontroller.cpp`, `tests/tabpagerwheelnavigation_test.cpp`, `tests/tabpagerdesktopnavigator_test.cpp`, `docs/architecture/README.md`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: scroll-up maps to previous desktop, scroll-down maps to next desktop, sub-step wheel input remains pending across navigation context changes, completed non-wrapping edge steps are consumed, backend activation result strings remain unchanged, QML still forwards raw wheel deltas to the backend, and all existing pager-visible behavior remains intact.
- Target-doc cleanup: replaced stale statements that `TabPagerDesktopNavigator` owns wheel pending state/sign conversion with the current `TabPagerWheelNavigation` boundary, removed only the completed navigator-extraction tactic from the suggested refactoring sequence, and kept the remaining QML wheel-event normalization concern open.
- Commands passed: `cmake --build build --target tabpagerwheelnavigation_test tabpagerdesktopnavigator_test tabpagerdesktopcontroller_test tabpagerbackend_test tabpagerview_test`; `ctest --test-dir build --output-on-failure -R 'tabpager(wheel|desktopnavigator|desktopcontroller|backend|view)'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/CMakeLists.txt packages/tab-pager/src/tabpagerdesktopcontroller.cpp packages/tab-pager/src/tabpagerdesktopcontroller.h packages/tab-pager/src/tabpagerdesktopnavigator.cpp packages/tab-pager/src/tabpagerdesktopnavigator.h packages/tab-pager/src/tabpagerwheelnavigation.cpp packages/tab-pager/src/tabpagerwheelnavigation.h packages/tab-pager/tests/tabpagerdesktopnavigator_test.cpp packages/tab-pager/tests/tabpagerwheelnavigation_test.cpp` from the repository root.
- Commands failed: `cmake --build build --target tabpagerwheelnavigation_test` failed after adding the characterization test and before implementation because `tabpagerwheelnavigation.h` did not exist yet.
- Deviations: this checkpoint intentionally did not extract QML wheel-event normalization; that remains separate because the current safe checkpoint focused on removing wheel state/sign conversion from the navigator.
- Ambiguity: no design ambiguity found for this checkpoint. The target asked for a dedicated wheel adapter and preservation of the pending-delta contract; both were addressed for C++ wheel-step handling while leaving unresolved QML normalization explicitly tracked.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
