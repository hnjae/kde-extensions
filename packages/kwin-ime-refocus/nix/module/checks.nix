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
        checks.kwin-ime-refocus-check = pkgs.buildNpmPackage {
          pname = "kwin-ime-refocus-check";
          inherit (package)
            npmDepsHash
            source
            version
            ;
          src = package.source;

          nativeBuildInputs = [
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kwin
          ];

          npmBuildScript = "check";
          dontWrapQtApps = true;

          installPhase = ''
            runHook preInstall
            touch "$out"
            runHook postInstall
          '';
        };
      };
  };
}
