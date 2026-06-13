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

## Remaining

- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: configured the plasmoid `main.qml` import from CMake's derived QML module URI.
- Files changed: `CMakeLists.txt`, `nix/lib/tab-pager-ci.nix`, `package/contents/ui/main.qml`, `package/contents/ui/main.qml.in`, `tests/tabpagermetadata_test.cpp`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`, repository-root `REUSE.toml`.
- Behavior preserved: generated and installed `main.qml` still imports `io.github.hnjae.tabpager as TabPager`, still instantiates `TabPager.TabPagerBackend`, and the installed plasmoid package still contains `contents/ui/main.qml`.
- Target-doc cleanup: removed the now-resolved P2 package identity/module metadata finding and preserved its architectural rule as a package metadata invariant under the recommended architecture.
- Target-doc edits: removed only tactical resolved evidence and migration text for repeated package/QML module metadata; kept the invariant that package metadata remains authoritative and CI guards drift.
- Commands passed: `cmake --build build --target tabpagermetadata_test`; `ctest --test-dir build --output-on-failure -R tabpagermetadata`; `cmake --install build`; `ctest --test-dir build --output-on-failure`; `nix develop ".#default" --command tab-pager-lint-qml`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files REUSE.toml packages/tab-pager/CMakeLists.txt packages/tab-pager/nix/lib/tab-pager-ci.nix packages/tab-pager/package/contents/ui/main.qml.in packages/tab-pager/tests/tabpagermetadata_test.cpp` from the repository root.
- Commands failed: `ctest --test-dir build --output-on-failure -R tabpagermetadata` failed after adding the metadata guard and before implementation because `package/contents/ui/main.qml.in` did not exist yet; the first test-layer commit attempt failed because `treefmt` reformatted `tests/tabpagermetadata_test.cpp`, then passed after restaging; `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R tabpagermetadata` failed after adding the Nix qml-lint guard and before updating `nix/lib/tab-pager-ci.nix`; `nix develop ".#default" --command tab-pager-lint-qml` initially failed because linting the build-tree generated `main.qml` could not resolve sibling local QML types, then passed after the lint source changed to the installed generated `main.qml`.
- Deviations: none.
- Ambiguity: no blocking ambiguity found. `src/tabpagerlogging.cpp` still uses `io.github.hnjae.tabpager` as a logging category, but it is not package identity, install-path, or QML module metadata.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
