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

## Remaining

- Extract wheel input mapping/sign handling from QML and navigator state if the dedicated wheel adapter remains the desired end state.
- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Deduplicate package identity, version, QML module URI, and install-path metadata beyond the current drift tests.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: added generic source/controller diagnostics health observability.
- Files changed: `src/tabpagerdesktopsource.h`, `src/taskmanagerdesktopsource.h`, `src/taskmanagerdesktopsource.cpp`, `src/tabpagerdesktopcontroller.h`, `src/tabpagerdesktopcontroller.cpp`, `tests/taskmanagerdesktopsource_test.cpp`, `tests/tabpagerbackendtesthelpers.h`, `tests/tabpagerdesktopcontroller_test.cpp`, `docs/architecture/README.md`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: desktop source-state mapping, source-state reload signals, activation requests/results, navigation settings, existing TaskManager structured `sourceDiagnostics()`, unchanged diagnostic suppression, diagnostic recovery logging, backend/QML API, and all visible pager behavior remain intact.
- Target-doc cleanup: removed the resolved source-diagnostics-as-log-only P2 finding, rewrote diagnostics guidance as a source/controller health invariant, and kept user-facing backend/QML diagnostics explicitly constrained to future display requirements.
- Commands passed: `cmake --build build --target taskmanagerdesktopsource_test tabpagerdesktopcontroller_test`; `ctest --test-dir build --output-on-failure -R 'taskmanagerdesktopsource|tabpagerdesktopcontroller'`; `ctest --test-dir build --output-on-failure`; `git diff --check`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/src/tabpagerdesktopsource.h packages/tab-pager/src/taskmanagerdesktopsource.h packages/tab-pager/src/taskmanagerdesktopsource.cpp packages/tab-pager/src/tabpagerdesktopcontroller.h packages/tab-pager/src/tabpagerdesktopcontroller.cpp packages/tab-pager/tests/taskmanagerdesktopsource_test.cpp packages/tab-pager/tests/tabpagerbackendtesthelpers.h packages/tab-pager/tests/tabpagerdesktopcontroller_test.cpp packages/tab-pager/docs/architecture/README.md packages/tab-pager/DESIGN_REVIEW_CORRECT_END_STATE.md packages/tab-pager/DESIGN_REVIEW_PROGRESS.md` from the repository root.
- Commands failed: the focused `taskmanagerdesktopsource_test tabpagerdesktopcontroller_test` build failed after adding characterization tests and before implementation because the generic diagnostics source/controller API did not exist yet; the first targeted pre-commit run failed because treefmt reformatted `tests/taskmanagerdesktopsource_test.cpp` and then passed on rerun; `just lint` failed on existing broad clang-tidy debt including enum-size findings, test cognitive-complexity/magic-number/designated-initializer findings, unchecked optional access, and the pre-existing narrowing finding in `tests/tabpagerdesktopcontroller_test.cpp`. The changed production files did not report new clang-tidy errors beyond existing included-header enum-size findings.
- Deviations: source diagnostics are not exposed through the QML-facing backend in this checkpoint because the design notes explicitly forbid QML diagnostic surface area before a concrete display or configuration requirement.
- Ambiguity: no design ambiguity found for this checkpoint; the target allowed either health state or a dedicated diagnostics stream, and the narrower source/controller health stream satisfies current non-UI observability without widening QML API.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
