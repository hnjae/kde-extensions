<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

# Design Review Progress

## Completed

- 2026-06-06: Read `DESIGN_REVIEW_CORRECT_END_STATE.md` in full and identified the highest-priority issues as the P1 source normalization/state invariant risks, backend/model ownership split, injectable QML composition, activation no-op taxonomy, and source anomaly diagnostics.
- 2026-06-06: Checkpoint 1 safety net committed as `092754a`, adding characterization coverage for shorter desktop names, longer desktop names, invalid IDs, duplicate IDs, and unmatched current desktop raw source data.
- 2026-06-06: Checkpoint 1 implementation extracted `TaskManagerDesktopRawState` and `taskManagerDesktopSourceStateFromRawState()` so raw TaskManager projection is testable without a QObject fake and `TaskManagerDesktopSource::sourceState()` is now a thin read-and-map adapter.

## Verification

- 2026-06-06: `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R taskmanagerdesktopsource --output-on-failure` passed.
- 2026-06-06: `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 10 CTest tests.

## Remaining

- Source normalization still preserves the characterized malformed-source outcomes; invalid ID filtering, duplicate-ID policy, unmatched-current policy, structured diagnostics, and logging remain to be centralized in later checkpoints.
- `TabPagerBackend` still subclasses `TabPagerDesktopModel`; backend composition and injectable QML view extraction remain pending P1 work.
- Activation/navigation no-op taxonomy remains pending P1 work.

## Deviations

- 2026-06-06: `just test` and `cmake --build build -v` both failed before running tests because the existing `build/` directory's Ninja invocation exited with `Segmentation fault`; verification used a fresh `build-codex/` directory instead.
