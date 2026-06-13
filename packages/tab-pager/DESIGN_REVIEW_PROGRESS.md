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

- Checkpoint: configured `qmldir` from CMake's derived QML module URI.
- Files changed: `CMakeLists.txt`, `src/qmldir`, `src/qmldir.in`, `tests/tabpagermetadata_test.cpp`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`, repository-root `REUSE.toml`.
- Behavior preserved: generated `qmldir` still declares `module io.github.hnjae.tabpager`, still depends on `QtQml.Models` and `QtQuick`, still names `tabpagerplugin`, and still points to `tabpagerplugin.qmltypes`; qmltypes export remains unchanged.
- Target-doc cleanup: removed the now-obsolete statement that `src/qmldir` repeats the concrete QML module URI, recorded that `qmldir` is configured from CMake's derived module URI, and kept the broader P2 package identity finding open because `src/tabpagerplugin.qmltypes` still repeats QML module metadata and type version.
- Target-doc edits: no architectural principles were removed; only completed `qmldir`-specific tactical evidence was updated.
- Commands passed: `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R tabpagermetadata`; `cmake --build build --target tabpagerqmltypes_test tabpagermetadata_test && ctest --test-dir build --output-on-failure -R 'tabpager(qmltypes|metadata)'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files REUSE.toml packages/tab-pager/CMakeLists.txt packages/tab-pager/src/qmldir.in packages/tab-pager/tests/tabpagermetadata_test.cpp packages/tab-pager/DESIGN_REVIEW_CORRECT_END_STATE.md packages/tab-pager/DESIGN_REVIEW_PROGRESS.md` from the repository root.
- Commands failed: `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R tabpagermetadata` failed after adding the metadata guard and before implementation because `src/qmldir.in` did not exist yet; the first pre-commit run failed because `qmldir.in` needed REUSE coverage and `treefmt` reformatted `tests/tabpagermetadata_test.cpp`, then passed after updating root `REUSE.toml` and rerunning focused tests.
- Deviations: this checkpoint intentionally did not generate or configure `src/tabpagerplugin.qmltypes`; that remains unresolved P2 work.
- Ambiguity: no blocking ambiguity found. The target explicitly called out repeated QML module metadata, and this checkpoint removes the `qmldir` source literal without changing generated QML module metadata.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
