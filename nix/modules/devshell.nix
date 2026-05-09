# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  flake-parts-lib,
  lib,
  ...
}:
{
  partitions.dev.module =
    { inputs, ... }:
    {
      options.perSystem = flake-parts-lib.mkPerSystemOption (_: {
        options.plasmaExtensions.devShell.commonPackages = lib.mkOption {
          type = lib.types.listOf lib.types.package;
          default = [ ];
          description = "Packages shared by development shells.";
        };
      });

      config.perSystem =
        {
          config,
          pkgs,
          system,
          lib,
          ...
        }:
        let
          devPkgs = import inputs.dev-nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        {
          plasmaExtensions.devShell.commonPackages = [
            # Static checkers (linters, ...):
            devPkgs.statix
            devPkgs.deadnix
            devPkgs.just
            devPkgs.prek
            devPkgs.shellcheck
            devPkgs.shellharden

            pkgs.clazy
            pkgs.cmake
            pkgs.llvmPackages.clang-unwrapped
            pkgs.kdePackages.extra-cmake-modules
            pkgs.kdePackages.kconfig
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kirigami
            pkgs.kdePackages.kwindowsystem
            pkgs.kdePackages.libplasma
            pkgs.kdePackages.plasma-activities
            pkgs.kdePackages.plasma-sdk
            pkgs.kdePackages.plasma-workspace
            pkgs.kdePackages.ksvg
            pkgs.ninja
            pkgs.nodejs
            pkgs.pkg-config
            pkgs.kdePackages.qtbase
            pkgs.kdePackages.qtdeclarative
            pkgs.qt6.qtdeclarative
          ]
          ++ config.pre-commit.settings.enabledPackages;

          pre-commit = {
            check.enable = true;
            pkgs = devPkgs;
            settings = {
              package = devPkgs.prek;
              gitPackage = devPkgs.gitMinimal;

              hooks = {
                # Static checkers:
                detect-private-keys.enable = true;
                cocogitto = {
                  enable = true;
                  name = "cog verify";
                  description = "Lint commit messages with Cocogitto.";
                  package = devPkgs.cocogitto;
                  entry = "${lib.getExe devPkgs.cocogitto} verify --file";
                  stages = [ "commit-msg" ];
                };
                reuse.enable = true;
                rumdl.enable = true;
                shellcheck.enable = true;
                typos.enable = true;

                # Formatter entrypoint:
                treefmt = {
                  enable = true;
                  packageOverrides.treefmt = config.treefmt.build.wrapper;
                };
              };
            };
          };

          devShells.default = pkgs.mkShellNoCC {
            packages = config.plasmaExtensions.devShell.commonPackages;

            shellHook = config.pre-commit.installationScript;
          };
        };
    };
}
