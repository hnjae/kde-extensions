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
        options.plasmaExtensions.devShell = {
          packages = lib.mkOption {
            type = lib.types.listOf lib.types.package;
            default = [ ];
            description = "Packages included in the canonical development shell.";
          };

          qmlImportPaths = lib.mkOption {
            type = lib.types.listOf lib.types.str;
            default = [ ];
            description = "QML import paths exported by the canonical development shell.";
          };

          qtPluginPaths = lib.mkOption {
            type = lib.types.listOf lib.types.str;
            default = [ ];
            description = "Qt plugin paths exported by the canonical development shell.";
          };

          shellHookFragments = lib.mkOption {
            type = lib.types.listOf lib.types.lines;
            default = [ ];
            description = "Additional shell hook fragments appended to the canonical development shell.";
          };
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
          clangToolchain = pkgs.llvmPackages.clang;
          qmlImportPath = lib.concatStringsSep ":" (
            lib.unique config.plasmaExtensions.devShell.qmlImportPaths
          );
          qtPluginPath = lib.concatStringsSep ":" (lib.unique config.plasmaExtensions.devShell.qtPluginPaths);
          shellHookFragments = lib.concatStringsSep "\n" config.plasmaExtensions.devShell.shellHookFragments;
        in
        {
          plasmaExtensions.devShell.packages = [
            # Static checkers (linters, ...):
            devPkgs.statix
            devPkgs.deadnix
            devPkgs.just
            devPkgs.prek
            devPkgs.shellcheck
            devPkgs.shellharden

            pkgs.clazy
            pkgs.cmake
            clangToolchain
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

          plasmaExtensions.devShell.qmlImportPaths = [
            "${pkgs.kdePackages.qtdeclarative}/lib/qt-6/qml"
            "${pkgs.kdePackages.kconfig}/lib/qt-6/qml"
            "${pkgs.kdePackages.kirigami}/lib/qt-6/qml"
            "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
            "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
            "${pkgs.kdePackages.plasma-workspace}/lib/qt-6/qml"
          ];

          plasmaExtensions.devShell.qtPluginPaths = [
            "${pkgs.kdePackages.libplasma}/lib/qt-6/plugins"
          ];

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
            packages = config.plasmaExtensions.devShell.packages;

            shellHook = # sh
            ''
              ${config.pre-commit.installationScript}

              export CC="${clangToolchain}/bin/clang"
              export CXX="${clangToolchain}/bin/clang++"
            ''
            + lib.optionalString (qmlImportPath != "") ''

              export QML_IMPORT_PATH="${qmlImportPath}''${QML_IMPORT_PATH:+:$QML_IMPORT_PATH}"
              export QML2_IMPORT_PATH="$QML_IMPORT_PATH"
            ''
            + lib.optionalString (qtPluginPath != "") ''

              export QT_PLUGIN_PATH="${qtPluginPath}''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
            ''
            + lib.optionalString (shellHookFragments != "") ''

              ${shellHookFragments}
            '';
          };
        };
    };
}
