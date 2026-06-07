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
        buildKPackage = import ../../../../nix/lib/kwin-script-devshell.nix {
          inherit lib pkgs;
          package = config.packages.kwin-run-or-raise;
          packageAttr = "kwin-run-or-raise";
          packagePath = "packages/kwin-run-or-raise";
        };
      in
      {
        plasmaExtensions.devShell.packages = [
          buildKPackage
          pkgs.biome
          pkgs.kdePackages.kpackage
          pkgs.kdePackages.kwin
          pkgs.nodejs
          pkgs.typescript
          pkgs.zip
        ];
      };
  };
}
