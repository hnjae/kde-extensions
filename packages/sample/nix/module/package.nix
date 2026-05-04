# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.sample =
        let
          pluginId = "com.example.plasmaextensions.sample";
          version = "0.1.0";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../package
              ../../src
              ../../test
              ../../tsconfig.json
            ];
          };
        in
        pkgs.stdenvNoCC.mkDerivation {
          pname = "plasma-extension-sample";
          inherit version source;
          src = source;

          nativeBuildInputs = with pkgs; [
            typescript
          ];

          dontConfigure = true;

          buildPhase = ''
            runHook preBuild
            tsc --project tsconfig.json --outDir build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            plasmoid="$out/share/plasma/plasmoids/${pluginId}"
            mkdir -p "$plasmoid"
            cp -R package/. "$plasmoid/"
            install -Dm0644 build/logic.js "$plasmoid/contents/ui/generated/logic.js"

            runHook postInstall
          '';

          passthru = {
            inherit
              pluginId
              version
              source
              ;
          };

          meta = {
            description = "Sample Plasma 6 widget built from TypeScript";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
