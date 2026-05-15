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
          npmDepsHash = "sha256-m6GN5TrsVLSiGkcn8gjHTofaH3ApVMTUjVLSDZAaWE0=";

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
          pname = "kwin-ime-refocus";
          inherit
            npmDepsHash
            version
            ;
          src = source;

          npmBuildScript = "build";

          installPhase = ''
            runHook preInstall

            install -d "$out/share/kwin/scripts/${pluginId}"
            cp -R dist/kwin-ime-refocus/. "$out/share/kwin/scripts/${pluginId}/"

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
            description = "A KWin script for manually refocusing windows to recover IME input";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
