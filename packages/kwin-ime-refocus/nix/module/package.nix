# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.kwin-ime-refocus =
        let
          pluginId = "io.github.hnjae.kwin-ime-refocus";
          version = "0.1.0";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.biome.json
              ../../package.json
              ../../scripts
              ../../src
              ../../tests
              ../../tsconfig.json
            ];
          };
        in
        pkgs.stdenvNoCC.mkDerivation {
          pname = "kwin-ime-refocus";
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
            cp -R dist/kwin-ime-refocus/. "$out/share/kwin/scripts/${pluginId}/"

            runHook postInstall
          '';

          passthru = {
            inherit
              pluginId
              source
              version
              ;
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
