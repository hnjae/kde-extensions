# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      { config, pkgs, ... }:
      {
        devShells.kwin-ime-refocus = pkgs.mkShellNoCC {
          packages = config.plasmaExtensions.devShell.commonPackages ++ [
            pkgs.biome
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kwin
            pkgs.nodejs
          ];

          shellHook = config.pre-commit.installationScript;
        };
      };
  };
}
