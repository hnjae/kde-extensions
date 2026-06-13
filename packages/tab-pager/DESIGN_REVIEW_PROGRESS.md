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

## Remaining

- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Deduplicate package identity, version, QML module URI, and install-path metadata beyond the current drift tests.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: extracted layout metrics formulas into the directly tested `PagerLayoutMetricsLogic.js` helper.
- Files changed: `docs/architecture/README.md`, `CMakeLists.txt`, `package/contents/ui/PagerLayoutMetrics.qml`, `package/contents/ui/PagerLayoutMetricsLogic.js`, `tests/tabpagerlayoutmetricslogic_test.cpp`, `tests/tabpagerlayoutmetrics_test.cpp`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: `desktopGap` remains `1`; fill/minimum extent remains `1`; unset preferred extent remains `-1`; horizontal panels still fill height and use bounded content width; vertical panels still fill width and use bounded content height; existing QML-facing `PagerLayoutMetrics` properties remain available.
- Target-doc cleanup: removed the completed P2 layout-metrics QML-integration testability finding and rewrote the Testability Agent appendix note to record direct layout-metrics coverage; kept the separate P3 layout-constants duplication finding open because child defaults and literals still remain.
- Target-doc edits: no architectural principles were removed; completed tactical wording about introducing a direct layout test seam was removed.
- Architecture-doc edits: added a `Layout Metrics Boundary` note that pure layout metrics helpers own deterministic sizing constants/formulas while QML owns binding and rendering.
- Commands passed: `cmake --build build --target tabpagerlayoutmetricslogic_test tabpagerlayoutmetrics_test`; `ctest --test-dir build --output-on-failure -R 'tabpagerlayoutmetrics(logic)?'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/docs/architecture/README.md packages/tab-pager/CMakeLists.txt packages/tab-pager/package/contents/ui/PagerLayoutMetrics.qml packages/tab-pager/package/contents/ui/PagerLayoutMetricsLogic.js packages/tab-pager/tests/tabpagerlayoutmetricslogic_test.cpp packages/tab-pager/tests/tabpagerlayoutmetrics_test.cpp packages/tab-pager/DESIGN_REVIEW_CORRECT_END_STATE.md packages/tab-pager/DESIGN_REVIEW_PROGRESS.md` from the repository root.
- Commands failed: `cmake --build build --target tabpagerlayoutmetricslogic_test` failed after adding the characterization test and before implementation because `package/contents/ui/PagerLayoutMetricsLogic.js` did not exist yet; the first pre-commit run failed because `treefmt` reformatted `PagerLayoutMetricsLogic.js` and `tests/tabpagerlayoutmetrics_test.cpp`, then passed after rerunning focused layout tests.
- Deviations: this checkpoint intentionally did not consolidate `PagerDesktopStrip.desktopGap` or all remaining child minimum extent literals; that remains separate P3 work.
- Ambiguity: no blocking ambiguity found. The target explicitly asked for a pure layout test seam and a QML smoke test, and this checkpoint provides that shape without changing visual behavior.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
