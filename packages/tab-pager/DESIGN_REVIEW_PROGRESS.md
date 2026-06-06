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
- 2026-06-06: Checkpoint 4 test layer committed as `3db1f43`, specifying an explicit `TabPagerBackend::model` property before changing the backend facade.
- 2026-06-06: Checkpoint 4 implementation introduced the explicit backend `model` property and migrated production QML row-model and tooltip-count bindings to use it while preserving the temporary inheritance-based compatibility surface.
- 2026-06-06: Checkpoint 5 test layer committed as `ed9036b`, specifying that the backend facade is not itself a `QAbstractItemModel` and that rows are reached through `backend.model`.
- 2026-06-06: Checkpoint 5 implementation converted `TabPagerBackend` to a `QObject` facade with a composed `TabPagerDesktopModel`, kept temporary `count` and `currentIndex` forwarding, moved fixed-font presentation policy to the facade, and updated QML type metadata.
- 2026-06-06: Checkpoint 6 test layer committed as `d5ea883`, specifying a `TabPagerDesktopController` boundary that synchronizes a source into a model and handles activation/navigation commands without the QML facade.
- 2026-06-06: Checkpoint 6 implementation extracted `TabPagerDesktopController`; `TabPagerBackend` now delegates source synchronization, activation, and navigation orchestration to the controller while remaining the QML facade.
- 2026-06-06: Checkpoint 7 test layer committed as `ad167bc`, specifying activation/navigation result taxonomy for invalid index, missing current desktop, edge stop, no wheel step, and successful activation.
- 2026-06-06: Checkpoint 7 implementation added controller-level activation results, richer navigator no-target reasons behind the existing optional API, and invalid activation logging through the shared `io.github.hnjae.tabpager` category.
- 2026-06-06: Checkpoint 8 test layer committed as `71debd2`, changing malformed source identity expectations from pass-through to normalized source-boundary behavior.
- 2026-06-06: Checkpoint 8 implementation normalized TaskManager source identity by dropping invalid desktop IDs, dropping duplicate desktop IDs after the first occurrence, and clearing unmatched current desktop IDs while preserving diagnostics.

## Verification

- 2026-06-06: `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R taskmanagerdesktopsource --output-on-failure` passed.
- 2026-06-06: `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 10 CTest tests.
- 2026-06-06: After checkpoint 2 implementation, `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 10 CTest tests.
- 2026-06-06: After checkpoint 3 implementation, `nix develop "path:../..#tab-pager" -c cmake --build build-codex && nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex --output-on-failure` passed, including all 11 CTest tests.
- 2026-06-06: Manual QML lint against the `build-codex` install prefix passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.
- 2026-06-06: After checkpoint 4 implementation, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R tabpagerbackend --output-on-failure`, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R tabpagerview --output-on-failure`, and the full `build-codex` CTest suite passed.
- 2026-06-06: After checkpoint 4 implementation, manual QML lint against `.tab-pager-install-codex` passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.
- 2026-06-06: After checkpoint 5 implementation, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R tabpagerbackend --output-on-failure` and the full `build-codex` CTest suite passed.
- 2026-06-06: After checkpoint 5 implementation, manual QML lint against `.tab-pager-install-codex` passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.
- 2026-06-06: After checkpoint 6 implementation, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R 'tabpagerdesktopcontroller|tabpagerbackend' --output-on-failure` and the full 12-test `build-codex` CTest suite passed.
- 2026-06-06: After checkpoint 6 implementation, manual QML lint against `.tab-pager-install-codex` passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.
- 2026-06-06: After checkpoint 7 implementation, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R tabpagerdesktopcontroller --output-on-failure` and the full 12-test `build-codex` CTest suite passed.
- 2026-06-06: After checkpoint 7 implementation, manual QML lint against `.tab-pager-install-codex` passed with `qmllint --ignore-settings --max-warnings 0 --unqualified disable`.
- 2026-06-06: After checkpoint 8 implementation, `nix develop "path:../..#tab-pager" -c ctest --test-dir build-codex -R taskmanagerdesktopsource --output-on-failure` and the full 12-test `build-codex` CTest suite passed.

## Remaining

- The highest-priority P1 checkpoints identified from the design review are implemented and verified; remaining design-review items are lower-priority follow-up work.
- Activation/navigation no-op taxonomy is explicit at the controller level; the public QML facade still intentionally exposes void invokables.

## Deviations

- 2026-06-06: `just test` and `cmake --build build -v` both failed before running tests because the existing `build/` directory's Ninja invocation exited with `Segmentation fault`; verification used a fresh `build-codex/` directory instead.
- 2026-06-06: `just lint-qml` failed for the same default `build/` Ninja `Segmentation fault`; QML lint was run manually against `build-codex` and `.tab-pager-install-codex`.
