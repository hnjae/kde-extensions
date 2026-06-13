# Design Review Progress

<!-- SPDX-FileCopyrightText: 2026 KIM Hyunjae -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

## Completed

- P1 model-index shape invariant: `TaskEntryLogic.mjs` now owns explicit `modelIndexState(...)` classification and actionability helpers. Diagnostics and action boundaries consume the named policy, preserving current unknown-shape actionability while no longer treating that case as simply valid.
- P1 disabled or invisible context-menu actions remain executable: `TaskContextMenuLogic.mjs` now routes descriptors with explicit `enabled: false` or `visible: false` to unavailable routes, and `TaskContextMenuActionDispatcher.qml` converts those routes into structured dispatch failures before any launcher, launcher-activity, or task-model effect can run. Missing availability fields remain actionable to preserve existing submenu leaf behavior.
