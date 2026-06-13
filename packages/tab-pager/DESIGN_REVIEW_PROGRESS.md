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
- `TabPagerActivationPlanner` covers direct index activation, navigation-result translation, and navigation-target command planning.
- Public desktop model roles are narrowed to `label` and `active`; broader row data remains internal.
- Navigation wrapping is internal to controller/navigation settings behavior, not public backend/QML API, desktop snapshot state, or desktop source state.
- `TabPagerNavigationSettingsSource` separates navigation policy from desktop inventory state.
- `TabPagerDesktopController` depends on `TabPagerDesktopStateStore`, not `TabPagerDesktopModel`; controller tests can use a fake state store.
- Optional/test-only navigation convenience wrappers were removed; typed navigation/activation results are the canonical internal APIs.
- `TabPagerBackend`, `TabPagerDesktopModel`, and row projection are documented as an intentional QML view-model boundary owning label formatting and `labelFont`.

## Remaining

- Extract wheel input mapping/sign handling from QML and navigator state if the dedicated wheel adapter remains the desired end state.
- Make source diagnostics observable through the generic source/controller/backend contract and remove diagnostic reporting from the getter-shaped `sourceState()` path.
- Reduce remaining controller orchestration by moving any residual activation/wheel decision logic into pure planners.
- Consolidate layout constants such as `desktopGap` and minimum extents.
- Deduplicate package identity, version, QML module URI, and install-path metadata beyond the current drift tests.
- Clarify whether `TabPagerVirtualDesktopInfo` is a real LibTaskManager port or only a source-test seam.

## Verification Baseline

- Recent full `ctest --test-dir build --output-on-failure` passed during the design-review refactor sequence.
- The latest design-review document update passed pre-commit hooks, including `reuse`, `rumdl`, `treefmt`, `typos`, and `cog verify`.
- Historical expected failures and focused target runs are intentionally omitted here; use the relevant commits for exact verification history.

## Latest Checkpoint

- Checkpoint: documented the already-characterized pending wheel-delta behavior in the user-facing interaction spec.
- Files changed: `docs/spec/SPEC.md`, `DESIGN_REVIEW_CORRECT_END_STATE.md`, `DESIGN_REVIEW_PROGRESS.md`.
- Behavior preserved: no source, model, QML, activation, label text, label font, layout, or navigation runtime behavior changed; wheel accumulation continues to persist across navigation context changes and completed stopped-at-edge wheel steps remain consumed.
- Target-doc cleanup: removed the resolved P2 uncertain wheel-delta context-scoping finding, kept the user-visible accumulation contract as an invariant for any future wheel-input extraction, and left the separate wheel input mapping/sign-handling refactor open.
- Commands passed: `ctest --test-dir build --output-on-failure -R tabpagerdesktopnavigator`; `git diff --check`; `nix develop "path:../..#default" -c rumdl check DESIGN_REVIEW_CORRECT_END_STATE.md DESIGN_REVIEW_PROGRESS.md docs/spec/SPEC.md`; `nix develop "path:../..#default" -c typos DESIGN_REVIEW_CORRECT_END_STATE.md DESIGN_REVIEW_PROGRESS.md docs/spec/SPEC.md`; `nix develop ".#default" --command prek run --hook-stage pre-commit --files packages/tab-pager/DESIGN_REVIEW_CORRECT_END_STATE.md packages/tab-pager/DESIGN_REVIEW_PROGRESS.md packages/tab-pager/docs/spec/SPEC.md` from the repository root; `nix develop ".#default" -c reuse lint` from the repository root.
- Commands failed: `ctest --test-dir build --output-on-failure` failed in existing non-wheel tests unrelated to this docs-only checkpoint. `tabpagerdesktoprows` and `tabpagerdesktopmodelstate` still expect `Name` role updates, while the current model behavior exposes narrowed public roles.
- Deviations: no new characterization tests were added because existing navigator tests already cover current-desktop changes, desktop-count changes, wrapping changes, no-current contexts, and non-wrapping edge stops.
- Ambiguity: no remaining ambiguity for this checkpoint; the spec now chooses the existing characterized behavior rather than changing runtime behavior.

## Notes

- Keep design-review work incremental; do not rewrite the widget architecture in one pass.
- Do not preserve pre-release compatibility unless explicitly requested.
- Do not remove `TabPagerVirtualDesktopInfo` until replacement coverage preserves TaskManager signal wiring behavior.
- Do not expose diagnostics to QML before there is a concrete display or configuration requirement.
