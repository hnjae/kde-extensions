# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.numbered-task-manager =
        let
          pluginId = "io.github.hnjae.numberedtaskmanager";
          version = "0.1.0";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../CMakeLists.txt
              ../../LICENSES
              ../../README.md
              ../../REUSE.toml
              ../../metainfo
              ../../package
              ../../tests
            ];
          };
        in
        pkgs.kdePackages.mkKdeDerivation {
          pname = "numbered-task-manager";
          inherit version source;
          src = source;

          extraNativeBuildInputs = [
            pkgs.kdePackages.extra-cmake-modules
            pkgs.kdePackages.plasma-workspace
          ];

          extraCmakeFlags = [
            "-DECM_DIR=${pkgs.kdePackages.extra-cmake-modules}/share/ECM/cmake"
          ];

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
