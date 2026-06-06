<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

# Design Review Progress

## Completed

- 2026-06-06: Read `DESIGN_REVIEW_CORRECT_END_STATE.md` in full and identified the highest-priority issues as the P1 source normalization/state invariant risks, backend/model ownership split, injectable QML composition, activation no-op taxonomy, and source anomaly diagnostics.
- 2026-06-06: Checkpoint 1 safety net committed as `092754a`, adding characterization coverage for shorter desktop names, longer desktop names, invalid IDs, duplicate IDs, and unmatched current desktop raw source data.
- 2026-06-06: Checkpoint 1 implementation extracted `TaskManagerDesktopRawState` and `taskManagerDesktopSourceStateFromRawState()` so raw TaskManager projection is testable without a QObject fake and `TaskManagerDesktopSource::sourceState()` is now a thin read-and-map adapter.
- 2026-06-06: Checkpoint 2 test layer committed as `a5f0cac`, specifying structured diagnostics for source name-count mismatches, invalid IDs, duplicate IDs, and unmatched current desktop data.
- 2026-06-06: Checkpoint 2 implementation added mapper diagnostics plus the `io.github.hnjae.tabpager` logging category; `TaskManagerDesktopSource` now logs source anomalies while returning the same source state.
- 2026-06-06: Checkpoint 3 test layer committed as `545e8fe`, specifying an injectable `TabPagerView.qml` that loads without Plasma shell imports and dispatches click/wheel interactions to a fake backend.
- 2026-06-06: Checkpoint 3 implementation extracted `TabPagerView.qml`, reduced `main.qml` to Plasma shell wiring plus production backend creation, and fixed horizontal delegate scoping in `PagerDesktopStrip.qml` so the extracted view can be tested.

## Verification

- 2026-06-06: `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R taskmanagerdesktopsource --output-on-failure` passed.
- 2026-06-06: `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 10 CTest tests.
- 2026-06-06: After checkpoint 2 implementation, `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 10 CTest tests.
- 2026-06-06: After checkpoint 3 implementation, `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 11 CTest tests.
- 2026-06-06: Manual QML lint against the `build-codex` install prefix passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.

## Remaining

- Source normalization still preserves the characterized malformed-source outcomes; invalid ID filtering, duplicate-ID policy, and unmatched-current policy remain to be centralized in later checkpoints.
- `TabPagerBackend` still subclasses `TabPagerDesktopModel`; backend composition remains pending P1 work.
- Activation/navigation no-op taxonomy remains pending P1 work.

## Deviations

- 2026-06-06: `just test` and `cmake --build build -v` both failed before running tests because the existing `build/` directory's Ninja invocation exited with `Segmentation fault`; verification used a fresh `build-codex/` directory instead.
- 2026-06-06: `just lint-qml` failed for the same default `build/` Ninja `Segmentation fault`; QML lint was run manually against `build-codex` and `.tab-pager-install-codex`.
