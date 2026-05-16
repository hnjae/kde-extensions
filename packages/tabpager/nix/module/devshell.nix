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
        package = config.packages.tabpager;
        ci = import ../lib/tabpager-ci.nix {
          inherit
            lib
            package
            pkgs
            ;
        };
      in
      {
        devShells.tabpager = pkgs.mkShellNoCC {
          packages =
            ci.lspDevShellPackages ++ config.plasmaExtensions.devShell.commonPackages ++ ci.devShellPackages;

          shellHook = # sh
            ''
              ${config.pre-commit.installationScript}
              ${ci.devShellHook}
            '';
        };
      };
  };
}
