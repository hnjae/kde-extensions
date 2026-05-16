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
        qmlImportPaths = [
          "${pkgs.kdePackages.qtdeclarative}/lib/qt-6/qml"
          "${pkgs.kdePackages.kconfig}/lib/qt-6/qml"
          "${pkgs.kdePackages.kirigami}/lib/qt-6/qml"
          "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
          "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
        ];
        qmlImportPath = lib.concatStringsSep ":" qmlImportPaths;
        qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;
        runtimeInputs = [
          pkgs.cmake
          pkgs.coreutils
          pkgs.git
          pkgs.kdePackages.extra-cmake-modules
          pkgs.kdePackages.kpackage
          pkgs.kdePackages.libplasma
          pkgs.ninja
          pkgs.qt6.qtdeclarative
          pkgs.stdenv.cc
        ];
        localProjectPreamble = ''
          set -euo pipefail

          repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
          if [ -d "$repo_root/packages/numbered-task-manager" ]; then
            cd "$repo_root/packages/numbered-task-manager"
          fi
        '';

        localBuildAndInstall = ''
          build_dir="''${NUMBERED_TASK_MANAGER_BUILD_DIR:-build}"
          install_prefix="''${NUMBERED_TASK_MANAGER_INSTALL_PREFIX:-$PWD/.numbered-task-manager-install}"

          cmake -S . -B "$build_dir" -G Ninja \
            -DCMAKE_INSTALL_PREFIX="$install_prefix"
          cmake --build "$build_dir"
          rm -rf "$install_prefix"
          cmake --install "$build_dir"
        '';
        mkDevCommand =
          name: text:
          pkgs.writeShellApplication {
            inherit name runtimeInputs;
            text = localProjectPreamble + text;
          };
        qmllsWrapper = pkgs.writeShellApplication {
          name = "qmlls";
          runtimeInputs = runtimeInputs;
          text = ''
            exec ${pkgs.kdePackages.qtdeclarative}/bin/qmlls \
              -I "$NUMBERED_TASK_MANAGER_INSTALL_PREFIX/share/plasma/plasmoids/${package.pluginId}/contents/ui" \
              ${qmlImportFlags} \
              "$@"
          '';
        };
      in
      {
        devShells.numbered-task-manager = pkgs.mkShellNoCC {
          packages = [
            qmllsWrapper
            (mkDevCommand "numbered-task-manager-lint" ''
              ${localBuildAndInstall}
              qmllint \
                --ignore-settings \
                --max-warnings 0 \
                --unqualified disable \
                ${qmlImportFlags} \
                package/contents/ui/main.qml
            '')
            (mkDevCommand "lint-qml" ''
              qmllint \
                --ignore-settings \
                --max-warnings 0 \
                --unqualified disable \
                ${qmlImportFlags} \
                package/contents/ui/main.qml
            '')
          ]
          ++ runtimeInputs
          ++ config.plasmaExtensions.devShell.commonPackages;

          shellHook = # sh
            ''
              ${config.pre-commit.installationScript}

              numbered_task_manager_project_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
              if [ -d "$numbered_task_manager_project_dir/packages/numbered-task-manager" ]; then
                numbered_task_manager_project_dir="$numbered_task_manager_project_dir/packages/numbered-task-manager"
              fi

              numbered_task_manager_install_prefix="''${NUMBERED_TASK_MANAGER_INSTALL_PREFIX:-$numbered_task_manager_project_dir/.numbered-task-manager-install}"

              export QML_IMPORT_PATH="${qmlImportPath}''${QML_IMPORT_PATH:+:$QML_IMPORT_PATH}"
              export QML2_IMPORT_PATH="$QML_IMPORT_PATH"
              export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
              export NUMBERED_TASK_MANAGER_INSTALL_PREFIX="$numbered_task_manager_install_prefix"
            '';
        };
      };
  };
}
