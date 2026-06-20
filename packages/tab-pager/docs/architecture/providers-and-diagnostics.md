# Tab Pager Providers And Diagnostics

## Source Diagnostics Boundary

`TabPagerDesktopSource` owns the generic source health read/signal boundary through `sourceHasDiagnostics()` and `sourceDiagnosticsChanged()`.

Source implementations may keep richer provider-specific diagnostics for tests and provider-local logging, but controller-level code should observe source health through the generic source interface rather than downcasting to a concrete provider or parsing logs.

TaskManager diagnostics are transition-based: unchanged malformed source data should not repeatedly emit generic diagnostic changes or duplicate warning logs, while appearance, material update, and recovery should be observable.

Do not expose source diagnostics through the QML-facing backend until there is a concrete display or configuration requirement.

## TaskManager Provider Boundary

`TabPagerDesktopSource` and `TabPagerNavigationSettingsSource` are the domain provider boundaries for desktop inventory, activation, source health, and navigation settings.

TaskManager-backed adapters may use a narrower LibTaskManager port internally to isolate `TaskManager::VirtualDesktopInfo` reads, signals, and activation requests. That port has no domain responsibility and should only be implemented by TaskManager adapter tests or production TaskManager wrapper code.

Non-LibTaskManager providers should implement the domain provider interfaces directly rather than the TaskManager-specific port.
