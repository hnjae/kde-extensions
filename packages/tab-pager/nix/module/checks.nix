# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      {
        config,
        pkgs,
        ...
      }:
      let
        package = config.packages.tab-pager;

        mkCheck =
          name:
          {
            nativeBuildInputs ? [ ],
            buildPhase,
          }:
          pkgs.stdenvNoCC.mkDerivation {
            pname = name;
            inherit nativeBuildInputs buildPhase;
            inherit (package) version source;
            src = package.source;

            dontConfigure = true;
            dontWrapQtApps = true;

            installPhase = ''
              runHook preInstall
              touch "$out"
              runHook postInstall
            '';
          };
      in
      {
        checks = {
          tab-pager-typecheck = mkCheck "tab-pager-typecheck" {
            nativeBuildInputs = [
              pkgs.typescript
            ];
            buildPhase = ''
              runHook preBuild
              tsc --project tsconfig.json --noEmit
              runHook postBuild
            '';
          };

          tab-pager-lint = mkCheck "tab-pager-lint" {
            nativeBuildInputs = [
              pkgs.biome
              pkgs.qt6.qtdeclarative
            ];
            buildPhase = ''
              runHook preBuild
              biome ci --config-path ${../../../../.biome.json} src test package/metadata.json tsconfig.json
              qmllint --ignore-settings package/contents/ui/main.qml
              runHook postBuild
            '';
          };

          tab-pager-test = mkCheck "tab-pager-test" {
            nativeBuildInputs = [
              pkgs.nodejs
              pkgs.typescript
            ];
            buildPhase = ''
              runHook preBuild
              tsc --project tsconfig.json --outDir build
              SAMPLE_LOGIC_JS="$PWD/build/logic.js" node --test test/logic.test.js
              runHook postBuild
            '';
          };

          tab-pager-kpackage = pkgs.stdenvNoCC.mkDerivation {
            pname = "tab-pager-kpackage";
            inherit (package) version;

            dontUnpack = true;
            dontWrapQtApps = true;

            nativeBuildInputs = [
              pkgs.kdePackages.kpackage
              pkgs.kdePackages.libplasma
            ];

            buildPhase = ''
              runHook preBuild

              export HOME="$TMPDIR/home"
              export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
              mkdir -p "$HOME" "$TMPDIR/plasmoids"

              kpackagetool6 \
                --type Plasma/Applet \
                --packageroot "$TMPDIR/plasmoids" \
                --install "${package}/share/plasma/plasmoids/${package.pluginId}"

              test -f "$TMPDIR/plasmoids/${package.pluginId}/metadata.json"
              test -f "$TMPDIR/plasmoids/${package.pluginId}/contents/ui/main.qml"
              test -f "$TMPDIR/plasmoids/${package.pluginId}/contents/ui/generated/logic.js"
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
  };
}
