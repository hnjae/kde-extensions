# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.kwin-run-or-raise =
        let
          pluginId = "io.github.hnjae.kwin-run-or-raise";
          version = "0.1.0";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.biome.json
              ../../README.md
              ../../package.json
              ../../scripts
              ../../src
              ../../tests
              ../../tsconfig.json
            ];
          };
        in
        pkgs.stdenvNoCC.mkDerivation {
          pname = "kwin-run-or-raise";
          inherit version;
          src = source;

          nativeBuildInputs = [
            pkgs.nodejs
            pkgs.typescript
          ];

          dontConfigure = true;

          buildPhase = ''
            runHook preBuild

            tsc --project tsconfig.json
            node scripts/build-package.mjs

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            install -d "$out/share/kwin/scripts/${pluginId}"
            cp -R dist/kwin-run-or-raise/. "$out/share/kwin/scripts/${pluginId}/"

            runHook postInstall
          '';

          passthru = {
            inherit
              pluginId
              source
              version
              ;
            kpackageCheckFiles = [
              "metadata.json"
              "contents/code/main.js"
              "contents/config/main.xml"
              "contents/ui/config.ui"
            ];
            kwinScriptInstallPath = "share/kwin/scripts/${pluginId}";
            mainScriptRelativePath = "code/main.js";
            packageName = "kwin-run-or-raise";
          };

          meta = {
            description = "A KWin script for run-or-raise global shortcuts";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
