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
          npmDepsHash = "sha256-l2/K1KIp35iV5WiotsibsJwwp4l/v1NjidhQAgQ6ajk=";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.biome.json
              ../../package-lock.json
              ../../package.json
              ../../scripts
              ../../src
              ../../tests
              ../../tsconfig.json
            ];
          };
        in
        pkgs.buildNpmPackage {
          pname = "kwin-run-or-raise";
          inherit
            npmDepsHash
            version
            ;
          src = source;

          npmBuildScript = "build";

          installPhase = ''
            runHook preInstall

            install -d "$out/share/kwin/scripts/${pluginId}"
            cp -R dist/kwin-run-or-raise/. "$out/share/kwin/scripts/${pluginId}/"

            runHook postInstall
          '';

          passthru = {
            inherit
              npmDepsHash
              pluginId
              source
              version
              ;
          };

          meta = {
            description = "A KWin script scaffold for run-or-raise global shortcuts";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
