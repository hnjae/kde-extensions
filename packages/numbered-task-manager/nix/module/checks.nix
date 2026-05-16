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
          "${pkgs.kdePackages.kirigami.unwrapped}/lib/qt-6/qml"
          "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
          "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
          "${pkgs.kdePackages.plasma-workspace}/lib/qt-6/qml"
        ];
        qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;
      in
      {
        checks.numbered-task-manager-check = pkgs.stdenvNoCC.mkDerivation {
          pname = "numbered-task-manager-check";
          inherit (package) version source;
          src = package.source;

          nativeBuildInputs = [
            pkgs.appstream
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.libplasma
            pkgs.kdePackages.plasma-workspace
            pkgs.nodejs
            pkgs.qt6.qtdeclarative
            pkgs.reuse
          ];

          dontConfigure = true;
          dontWrapQtApps = true;

          buildPhase = ''
            runHook preBuild

            reuse lint

            installed_plasmoid="${package}/share/plasma/plasmoids/${package.pluginId}"
            installed_metainfo="${package}/share/metainfo/${package.pluginId}.metainfo.xml"
            installed_license_dir="${package}/share/licenses/numbered-task-manager"
            required_plasmoid_files="
              metadata.json
              contents/ui/main.qml
              contents/ui/TaskItem.qml
              contents/ui/AttentionItem.qml
              contents/ui/TaskContextMenu.qml
              contents/ui/ActivityScopeLogic.js
              contents/ui/LauncherListLogic.js
              contents/ui/TaskActivityLogic.js
              contents/ui/TaskEntryLogic.js
              contents/ui/RemoteAttentionLogic.js
              contents/ui/TaskModelLogic.js
              contents/ui/NumberBadge.qml
              contents/config/main.xml
            "
            for file in $required_plasmoid_files
            do
              test -f "$installed_plasmoid/$file"
            done

            test -f "$installed_license_dir/AGPL-3.0-or-later.txt"
            test -f "$installed_license_dir/CC0-1.0.txt"

            for test_file in tests/*.test.mjs
            do
              node "$test_file"
            done

            find package/contents/ui -name '*.qml' -print0 \
              | sort -z \
              | xargs -0 qmllint \
                  --ignore-settings \
                  --max-warnings 0 \
                  --unqualified disable \
                  ${qmlImportFlags}

            find "$installed_plasmoid/contents/ui" -name '*.qml' -print0 \
              | sort -z \
              | xargs -0 qmllint \
                  --ignore-settings \
                  --max-warnings 0 \
                  --unqualified disable \
                  ${qmlImportFlags}

            # KAboutLicense does not map AGPL identifiers, so the KPackage
            # generator cannot export our project license. Ship explicit
            # AppStream metadata and validate that installed artifact instead.
            test -f "$installed_metainfo"
            grep -q '<project_license>AGPL-3.0-or-later</project_license>' "$installed_metainfo"
            grep -q '<metadata_license>CC0-1.0</metadata_license>' "$installed_metainfo"
            appstreamcli validate --no-net "$installed_metainfo"

            export HOME="$TMPDIR/home"
            export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
            mkdir -p "$HOME" "$TMPDIR/plasmoids"

            kpackagetool6 \
              --type Plasma/Applet \
              --packageroot "$TMPDIR/plasmoids" \
              --install "$installed_plasmoid"

            for file in $required_plasmoid_files
            do
              test -f "$TMPDIR/plasmoids/${package.pluginId}/$file"
            done
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
