# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      { config, pkgs, ... }:
      let
        package = config.packages.kwin-run-or-raise;
      in
      {
        checks.kwin-run-or-raise-check = pkgs.buildNpmPackage {
          pname = "kwin-run-or-raise-check";
          inherit (package)
            npmDepsHash
            source
            version
            ;
          src = package.source;

          nativeBuildInputs = [
            pkgs.biome
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kwin
          ];

          npmBuildScript = "check";
          dontWrapQtApps = true;

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
