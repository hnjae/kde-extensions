<!--
SPDX-FileCopyrightText: 2026 KIM Hyunjae
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Tab Pager Architecture

## QML View-Model Boundary

`TabPagerBackend`, `TabPagerDesktopModel`, `TabPagerDesktopModelState`, `TabPagerDesktopRows`, and `TabPagerDesktopRowData` are an intentional QML view-model boundary.

The boundary owns the presentation projection required by the current QML surface: stable row identity, active-row state, visible desktop labels, QML role names, model change notification planning, count/current-index facade properties, activation entry points, activation result names, and the fixed-width label font exposed as `labelFont`.

The desktop source and normalized desktop snapshot remain semantic input boundaries. They should not depend on QML role names, fonts, label metrics, Qt Quick layout behavior, or other rendering concerns.

Label text formatting belongs to the view-model boundary while the widget's public behavior is "show default desktop names by number and custom names by name." `TabPagerDesktopLogic::labelForDesktop()` is part of this projection, not a source-state normalization rule.

`labelFont` belongs to `TabPagerBackend` because QML needs the same font for metrics and rendering. Keep additional presentation decisions in this boundary only when they are stable widget contract or QML adapter concerns; rendering geometry and event delivery remain QML responsibilities unless a pure helper is introduced for testability.

If future behavior needs a reusable domain model outside QML, introduce a separate semantic API instead of widening the QML row roles or treating `TabPagerBackend` as command-only.

## Source Diagnostics Boundary

`TabPagerDesktopSource` owns the generic source health read/signal boundary through `sourceHasDiagnostics()` and `sourceDiagnosticsChanged()`.

Source implementations may keep richer provider-specific diagnostics for tests and provider-local logging, but controller-level code should observe source health through the generic source interface rather than downcasting to a concrete provider or parsing logs.

TaskManager diagnostics are transition-based: unchanged malformed source data should not repeatedly emit generic diagnostic changes or duplicate warning logs, while appearance, material update, and recovery should be observable.

Do not expose source diagnostics through the QML-facing backend until there is a concrete display or configuration requirement.
