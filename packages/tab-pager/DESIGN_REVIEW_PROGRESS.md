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
- QML layout constants such as `desktopGap`, fill minimum extent, and unset preferred extent are owned by `PagerLayoutMetricsLogic.js`/`PagerLayoutMetrics.qml` and passed explicitly to layout consumers.
- Nix package metadata now derives `qmlModuleDir` from `pluginId`, exposes it through package passthru, and uses it for QML install-path checks.
- Nix package metadata now derives `pluginId` and `version` from `package/metadata.json`.
- Layout metrics formulas now live in `PagerLayoutMetricsLogic.js`, are directly tested without `QQmlEngine`, and keep a focused QML binding smoke test.
- CMake package metadata now derives `PLASMOID_ID`, project version, QML module URI, and QML module path from `package/metadata.json`.
- `qmldir` is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- `tabpagerplugin.qmltypes` is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- The plasmoid `main.qml` import is configured from CMake's derived `QML_MODULE_URI` and no longer repeats the concrete module URI in source.
- Wheel navigation no-step/offset target translation now lives in `TabPagerDesktopNavigator` and is directly covered by pure navigator tests.
- Activation result-name mapping now lives in a pure helper and is directly covered without backend/source fixtures.
- Backend activation tests now cover facade forwarding and no longer repeat the lower-level controller/navigation/wheel activation matrix.
- Controller navigation activation uses the activation planner's target-index plan for state-store lookup instead of reading navigation-result sentinel values directly.
- The LibTaskManager raw-info seam is named `TaskManagerVirtualDesktopInfoPort` and documented as a TaskManager-specific port; domain providers implement `TabPagerDesktopSource` and `TabPagerNavigationSettingsSource` directly.

## Remaining

- Keep controller orchestration from growing when new source synchronization, navigation, or activation behavior is added.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: clarified the LibTaskManager adapter seam as a TaskManager-specific port.
- Files changed: `docs/architecture/README.md`, `src/taskmanagervirtualdesktopinfoport.h`, `src/taskmanagervirtualdesktopinfoport.cpp`, `src/taskmanagerdesktopsource.h`, `src/taskmanagerdesktopsource.cpp`, `tests/taskmanagerdesktopsource_test.cpp`, `CMakeLists.txt`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: TaskManager raw-state mapping, diagnostic reporting/logging, source-state signal forwarding, navigation-wrapping signal forwarding, and valid-only activation forwarding remain unchanged.
- Target-doc cleanup: removed only the resolved LibTaskManager adapter-boundary finding and its direct sequence note from `DESIGN_REVIEW_CORRECT_END_STATE.md`; kept the controller orchestration finding.
- Target-doc edits: no unresolved controller design-review finding was removed.
- Commands passed: `cmake --build build --target taskmanagerdesktopsource_test tabpagerplugin`; `ctest --test-dir build --output-on-failure -R 'taskmanagerdesktopsource'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; pre-commit hooks run by commit, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Commands failed: none.
- Deviations: no public backend/model/source/controller API changed; the lower-level TaskManager test seam was kept rather than collapsed.
- Ambiguity: no blocking ambiguity found after accepting that no P0/P1 findings remain and the next safe checkpoint is P3.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TaskManagerVirtualDesktopInfoPort` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
