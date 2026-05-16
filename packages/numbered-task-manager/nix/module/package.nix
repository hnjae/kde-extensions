# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.numbered-task-manager =
        let
          metadataJson = builtins.fromJSON (builtins.readFile ../../package/metadata.json);
          pluginId = metadataJson.KPlugin.Id;
          version = metadataJson.KPlugin.Version;

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.biome.json
              ../../LICENSES
              ../../README.md
              ../../metainfo
              ../../package
              ../../tests
            ];
          };
        in
        pkgs.stdenvNoCC.mkDerivation {
          pname = "numbered-task-manager";
          inherit version;
          src = source;

          dontConfigure = true;
          dontBuild = true;

          installPhase = ''
            runHook preInstall

            install -d "$out/share/plasma/plasmoids/${pluginId}"
            cp -R --no-preserve=mode package/. "$out/share/plasma/plasmoids/${pluginId}/"

            install -D -m 0644 \
              metainfo/${pluginId}.metainfo.xml \
              "$out/share/metainfo/${pluginId}.metainfo.xml"

            install -d "$out/share/licenses/numbered-task-manager"
            install -m 0644 LICENSES/*.txt "$out/share/licenses/numbered-task-manager/"

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
            description = "A Plasma 6 task manager for keyboard-friendly window selection";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
