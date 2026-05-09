# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      {
        config,
        lib,
        pkgs,
        ...
      }:
      let
        package = config.packages.tab-pager;
        ci = import ../lib/tab-pager-ci.nix {
          inherit
            lib
            package
            pkgs
            ;
        };
      in
      {
        devShells.tab-pager = pkgs.mkShellNoCC {
          packages = config.plasmaExtensions.devShell.commonPackages ++ ci.devShellPackages;

          shellHook = ''
            ${config.pre-commit.installationScript}

            echo "Tab Pager C++/QML Plasma extension" >&2
            echo "  nix build path:../..#tab-pager" >&2
            echo "  tab-pager-ci-local" >&2
            echo "  lint-qml | lint-clang-tidy | lint-clazy" >&2
            echo '  "$(nix build path:../..#tab-pager --no-link --print-out-paths)/bin/tab-pager-hello"' >&2
            echo '  QML_IMPORT_PATH="$(nix build path:../..#tab-pager --no-link --print-out-paths)/lib/qt-6/qml" plasmoidviewer -a "$(nix build path:../..#tab-pager --no-link --print-out-paths)/share/plasma/plasmoids/${package.pluginId}"' >&2
          '';
        };
      };
  };
}
