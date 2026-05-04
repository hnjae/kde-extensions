# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      {
        config,
        pkgs,
        ...
      }:
      let
        package = config.packages.tab-pager;
      in
      {
        devShells.tab-pager = pkgs.mkShellNoCC {
          packages = config.plasmaExtensions.devShell.commonPackages;

          shellHook = ''
            ${config.pre-commit.installationScript}

            echo "Sample Plasma extension" >&2
            echo "  nix build .#tab-pager" >&2
            echo '  plasmoidviewer -a "$(nix build .#tab-pager --no-link --print-out-paths)/share/plasma/plasmoids/${package.pluginId}"' >&2
          '';
        };
      };
  };
}
