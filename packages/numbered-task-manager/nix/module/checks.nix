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
        qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;
      in
      {
        checks.numbered-task-manager-check = pkgs.stdenv.mkDerivation {
          pname = "numbered-task-manager-check";
          inherit (package) version source;
          src = package.source;

          nativeBuildInputs = [
            pkgs.cmake
            pkgs.kdePackages.extra-cmake-modules
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.libplasma
            pkgs.ninja
            pkgs.qt6.qtdeclarative
          ];

          dontConfigure = true;
          dontWrapQtApps = true;

          buildPhase = ''
            runHook preBuild

            build_dir=build
            install_prefix="$TMPDIR/install"

            cmake -S . -B "$build_dir" -G Ninja \
              -DCMAKE_INSTALL_PREFIX="$install_prefix"
            cmake --build "$build_dir"
            cmake --install "$build_dir"

            qmllint \
              --ignore-settings \
              --max-warnings 0 \
              --unqualified disable \
              ${qmlImportFlags} \
              package/contents/ui/main.qml

            export HOME="$TMPDIR/home"
            export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
            mkdir -p "$HOME" "$TMPDIR/plasmoids"

            kpackagetool6 \
              --type Plasma/Applet \
              --packageroot "$TMPDIR/plasmoids" \
              --install "$install_prefix/share/plasma/plasmoids/${package.pluginId}"

            test -f "$TMPDIR/plasmoids/${package.pluginId}/metadata.json"
            test -f "$TMPDIR/plasmoids/${package.pluginId}/contents/ui/main.qml"
            kpackagetool6 --hash "$TMPDIR/plasmoids/${package.pluginId}"

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            touch "$out"
            runHook postInstall
          '';
        };
      };
  };
}
