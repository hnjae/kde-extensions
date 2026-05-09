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
