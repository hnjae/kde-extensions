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

- Checkpoint: derived Nix `pluginId` and `version` from `package/metadata.json`.
- Files changed: `docs/architecture/README.md`, `nix/module/package.nix`, `tests/tabpagermetadata_test.cpp`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: package `pluginId` remains `io.github.hnjae.tabpager`; package version remains `0.1.0`; the derived QML module path remains `io/github/hnjae/tabpager`; CMake identity, KPackage metadata, `qmldir`, qmltypes export, and installed QML file checks remain semantically unchanged.
- Target-doc cleanup: removed the now-obsolete statement that `nix/module/package.nix` repeats concrete `pluginId` and `version` literals, recorded the current Nix package-metadata derivation, and kept the broader P2 package identity finding open because CMake, KPackage metadata, `qmldir`, and qmltypes still do not share one authoritative declaration.
- Target-doc edits: no architectural principles were removed; only completed Nix-specific tactical evidence was updated.
- Architecture-doc edits: added a `Package Metadata Boundary` note that `package/metadata.json` owns package identity and release version for Nix packaging.
- Commands passed: `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R tabpagermetadata`; `nix eval .#packages.x86_64-linux.tab-pager.pluginId && nix eval .#packages.x86_64-linux.tab-pager.version && nix eval .#packages.x86_64-linux.tab-pager.qmlModuleDir` from the repository root; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/docs/architecture/README.md packages/tab-pager/nix/module/package.nix packages/tab-pager/tests/tabpagermetadata_test.cpp packages/tab-pager/DESIGN_REVIEW_CORRECT_END_STATE.md packages/tab-pager/DESIGN_REVIEW_PROGRESS.md` from the repository root.
- Commands failed: `cmake --build build --target tabpagermetadata_test && ctest --test-dir build --output-on-failure -R tabpagermetadata` failed after adding the metadata guard and before implementation because Nix did not yet read `package/metadata.json`; the first pre-commit run failed because `treefmt` reformatted `tests/tabpagermetadata_test.cpp`, then passed after rerunning the focused metadata test.
- Deviations: this checkpoint intentionally did not choose a single repository-wide authority for CMake, KPackage metadata, QML metadata, and qmltypes generation; that remains unresolved P2 work.
- Ambiguity: no blocking ambiguity found. The target explicitly called out repeated package identity/version metadata, and this checkpoint removes the Nix-side duplication without changing package identity or version.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
