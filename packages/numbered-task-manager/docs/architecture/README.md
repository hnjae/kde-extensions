# Numbered Task Manager Architecture

Numbered Task Manager's implementation constraints support the user behavior described in [the specs](../spec/README.md).

Architecture notes are split by subject:

- [Foundations](foundations.md): KDE API boundaries, package shape, module boundaries, and root-owned platform state.
- [Platform and model scope](platform-and-model-scope.md): task model policy, activity/desktop scope, and remote attention.
- [Context menu and actions](context-menu-and-actions.md): Plasma-native task menus, role snapshots, route dispatch, command descriptors, and diagnostics.
- [Launchers and drag](launchers-and-drag.md): launcher-list ownership, pin state, activity updates, move policy, and drag/drop boundaries.
- [Task composition and activation](task-composition-and-activation.md): task entry projection, source stores, visible item composition, shortcut routing, activation, and action results.
- [Visual policy](visual-policy.md): badge presentation, themed frames, task-like shared visual components, and layout metrics.
- [Packaging and verification](packaging-and-verification.md): supported dependencies and implementation verification.
