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
        package = config.packages.numbered-task-manager;
        ci = import ../lib/numbered-task-manager-ci.nix {
          inherit
            lib
            package
            pkgs
            ;
        };
      in
      {
        plasmaExtensions.devShell.packages =
          ci.lspDevShellPackages ++ ci.devShellPackages ++ ci.checkNativeBuildInputs ++ ci.checkBuildInputs;

        plasmaExtensions.devShell.qmlImportPaths = ci.qmlImportPaths;
        plasmaExtensions.devShell.qtPluginPaths = ci.qtPluginPaths;
      };
  };
}
