<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

# Design Review Progress

## P0/P1 Triage

- P0: none identified in `DESIGN_REVIEW_CORRECT_END_STATE.md`.
- P1: competing pin-state ownership; no single visible-order, slot-numbering, and `Meta+0` owner; root-level task-manager controller state in `main.qml`; context-menu policy inside `TaskContextMenu.qml`; launcher sync without failure-safe semantics; user actions failing as silent no-ops; hidden delegate publication flow; remote attention state spread through root.

## Checkpoint 1: Visible Item Composer

- Status: in progress.
- What will change: add a tested visible-item composer that owns final visible item order, normal slot numbers, item source metadata, visible count, and shortcut target selection.
- Behavior that must remain unchanged: normal task entries render before the remote-attention item; remote attention remains a single far-right item when present; slots 1 through 9 keep their current labels; tasks after slot 9 remain unnumbered; `Meta+0` targets the final visible item; the remote-attention item remains unbadged.
- Verification: host JS tests for no tasks, fewer than nine tasks, more than nine tasks, `Meta+0` without remote attention, and `Meta+0` with remote attention; relevant lint/check commands after implementation.
- Likely files: `docs/architecture/ARCHITECTURE.md`, `DESIGN_REVIEW_PROGRESS.md`, `package/contents/ui/VisibleTaskItemsLogic.js`, `package/contents/ui/main.qml`, `tests/visibletaskitemslogic.test.mjs`, and source-regex tests that currently assert old root-owned policy.

## Remaining Follow-Up Work

- Pin/menu state: move widget pin membership into shared launcher/menu-facing state and stop using live `atm.HasLauncher` to decide Pin/Unpin state.
- Launcher sync: wrap launcher-list writes in a failure-safe transaction helper and add convergence diagnostics.
- Root/model ownership: extract normal publication/order and remote-attention source state from `main.qml` in later checkpoints.
- Context menu: migrate role normalization and action policy into tested helpers before simplifying the QML menu.
- Observability: add structured action results for activation, menu creation, and launcher mutations.
