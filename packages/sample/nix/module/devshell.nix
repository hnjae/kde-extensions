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
        package = config.packages.sample;
      in
      {
        devShells.sample = pkgs.mkShellNoCC {
          packages = config.plasmaExtensions.devShell.commonPackages;

          shellHook = ''
            ${config.pre-commit.installationScript}

            echo "Sample Plasma extension" >&2
            echo "  nix build .#sample" >&2
            echo '  plasmoidviewer -a "$(nix build .#sample --no-link --print-out-paths)/share/plasma/plasmoids/${package.pluginId}"' >&2
          '';
        };
      };
  };
}
