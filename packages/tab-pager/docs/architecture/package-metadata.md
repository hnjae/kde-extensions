# Tab Pager Package Metadata Boundary

`package/metadata.json` owns the package identity and release version used by build and packaging metadata.

CMake and Nix packaging should derive package ID, version, QML module URI/path, and dependent install-path metadata from package metadata rather than repeating the same literals.

QML module metadata files are build outputs when they need the package-derived module URI. Source templates may keep QML API declarations, but the concrete import URI should be configured from CMake's package metadata boundary.
