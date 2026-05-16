# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.kwin-ime-refocus =
        let
          packageJson = builtins.fromJSON (builtins.readFile ../../package.json);
          kpackageJson = builtins.fromJSON (builtins.readFile ../../kpackage.json);
          mainScriptRelativePath = kpackageJson."X-Plasma-MainScript";
          pluginId = kpackageJson.KPlugin.Id;
          version = packageJson.version;

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.biome.json
              ../../kpackage.json
              ../../package.json
              ../../scripts
              ../../src
              ../../tests
              ../../tsconfig.json
            ];
          };
        in
        pkgs.stdenvNoCC.mkDerivation {
          pname = packageJson.name;
          inherit version;
          src = source;

          nativeBuildInputs = [
            pkgs.nodejs
            pkgs.typescript
          ];

          dontConfigure = true;

          buildPhase = ''
            runHook preBuild

            tsc --project tsconfig.json --outFile build/src/main.js
            node scripts/build-package.mjs

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            install -d "$out/share/kwin/scripts/${pluginId}"
            cp -R dist/${packageJson.name}/. "$out/share/kwin/scripts/${pluginId}/"

            runHook postInstall
          '';

          passthru = {
            inherit
              mainScriptRelativePath
              pluginId
              source
              version
              ;
            packageName = packageJson.name;
          };

          meta = {
            description = "A KWin script for manually refocusing windows to recover IME input";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
