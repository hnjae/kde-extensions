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
- QML wheel-event normalization now lives in `TabPagerWheelInput.js` and is directly tested without Quick-window event dispatch.
- Nix package metadata now derives `qmlModuleDir` from `pluginId`, exposes it through package passthru, and uses it for QML install-path checks.
- Nix package metadata now derives `pluginId` and `version` from `package/metadata.json`.
- Layout metrics formulas now live in `PagerLayoutMetricsLogic.js`, are directly tested without `QQmlEngine`, and keep a focused QML binding smoke test.
- CMake package metadata now derives `PLASMOID_ID`, project version, QML module URI, and QML module path from `package/metadata.json`.
- `qmldir` is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- `tabpagerplugin.qmltypes` is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- The plasmoid `main.qml` import is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- Wheel navigation no-step/offset target translation now lives in `TabPagerDesktopNavigator` and is directly covered by pure navigator tests.
- Activation result-name mapping now lives in a pure helper and is directly covered without backend/source fixtures.

## Remaining

- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: extracted activation result-name mapping into a pure helper.
- Files changed: `CMakeLists.txt`, `src/tabpageractivationresult.h`, `src/tabpageractivationresult.cpp`, `src/tabpageractivationplanner.h`, `src/tabpagerbackend.cpp`, `tests/tabpageractivationresult_test.cpp`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: backend `activationFinished(QString)` still emits the same result names for every `TabPagerActivationResult` value.
- Target-doc cleanup: kept the controller/backend activation P2 open and updated its current-state/design-concern text to say result-name mapping is now pure while backend facade forwarding still requires integration coverage.
- Target-doc edits: no architectural principles or unresolved P2 content were removed.
- Commands passed: `cmake --build build --target tabpageractivationresult_test tabpageractivationplanner_test tabpagerbackend_test tabpagerdesktopcontroller_test`; `ctest --test-dir build --output-on-failure -R 'tabpager(activationresult|activationplanner|backend|desktopcontroller)'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/CMakeLists.txt packages/tab-pager/src/tabpageractivationresult.h packages/tab-pager/src/tabpageractivationresult.cpp packages/tab-pager/src/tabpageractivationplanner.h packages/tab-pager/src/tabpagerbackend.cpp packages/tab-pager/tests/tabpageractivationresult_test.cpp` from the repository root.
- Commands failed: `cmake --build build --target tabpageractivationresult_test` failed after adding the pure helper test and before implementation because `tabpageractivationresult.h` did not exist yet; the first test-layer commit attempt failed because `treefmt` reformatted `tests/tabpageractivationresult_test.cpp`, then passed after restaging.
- Deviations: none.
- Ambiguity: no blocking ambiguity found. The remaining P2 is still open because controller source execution, backend facade forwarding, and some activation behavior coverage still require integration-style fixtures.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
