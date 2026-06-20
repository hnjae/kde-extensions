# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.numbered-task-manager =
        let
          metadataJson = builtins.fromJSON (builtins.readFile ../../package/metadata.json);
          clangToolchain = pkgs.llvmPackages.clang;
          pluginId = metadataJson.KPlugin.Id;
          qmlModuleDir = lib.replaceStrings [ "." ] [ "/" ] pluginId;
          version = metadataJson.KPlugin.Version;

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.clang-tidy
              ../../CMakeLists.txt
              ../../LICENSES
              ../../metainfo
              ../../package
              ../../src
              ../../tests
            ];
          };
        in
        pkgs.kdePackages.mkKdeDerivation {
          pname = "numbered-task-manager";
          inherit version source;
          src = source;

          extraNativeBuildInputs = [
            clangToolchain
            pkgs.kdePackages.extra-cmake-modules
          ];

          extraBuildInputs = [
            pkgs.kdePackages.kconfig
            pkgs.kdePackages.kio
            pkgs.kdePackages.knotifications
            pkgs.kdePackages.kservice
            pkgs.kdePackages.qtbase
            pkgs.kdePackages.qtdeclarative
          ];

          extraCmakeFlags = [
            "-DCMAKE_CXX_COMPILER=${clangToolchain}/bin/clang++"
            "-DECM_DIR=${pkgs.kdePackages.extra-cmake-modules}/share/ECM/cmake"
            "-DCMAKE_EXPORT_COMPILE_COMMANDS=ON"
            "-DBUILD_TESTING=OFF"
            "-DKDE_INSTALL_QMLDIR=lib/qt-6/qml"
          ];

          passthru = {
            inherit
              pluginId
              qmlModuleDir
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
