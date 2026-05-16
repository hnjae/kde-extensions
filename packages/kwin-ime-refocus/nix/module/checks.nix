# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      { config, pkgs, ... }:
      let
        package = config.packages.kwin-ime-refocus;
      in
      {
        checks.kwin-ime-refocus-check = pkgs.stdenvNoCC.mkDerivation {
          pname = "kwin-ime-refocus-check";
          inherit (package) version;
          src = package.source;

          nativeBuildInputs = [
            pkgs.biome
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kwin
            pkgs.nodejs
            pkgs.typescript
          ];

          dontConfigure = true;
          dontWrapQtApps = true;

          buildPhase = ''
            runHook preBuild

            tsc --noEmit --project tsconfig.json
            tsc --noEmit --project tests/tsconfig.json
            biome ci .biome.json kpackage.json package.json scripts src tests tsconfig.json
            tsc --project tsconfig.json
            node scripts/build-package.mjs
            node scripts/check-kpackage.mjs
            tsc --project tests/tsconfig.json
            node --test build-tests/*.test.js

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            packageRoot="${package}/share/kwin/scripts/${package.pluginId}"
            test -f "$packageRoot/metadata.json"
            test -f "$packageRoot/contents/code/main.js"

            touch "$out"
            runHook postInstall
          '';
        };
      };
  };
}
