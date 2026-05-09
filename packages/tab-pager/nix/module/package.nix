# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.tab-pager =
        let
          pluginId = "com.example.plasmaextensions.tab-pager";
          version = "0.1.0";

          sourceRoot = ../../.;
          source = lib.fileset.toSource {
            root = sourceRoot;
            fileset = lib.fileset.unions [
              ../../.clang-tidy
              ../../CMakeLists.txt
              ../../package
              ../../src
              ../../tests
            ];
          };
        in
        pkgs.kdePackages.mkKdeDerivation {
          pname = "plasma-extension-tab-pager";
          inherit version source;
          src = source;

          extraNativeBuildInputs = [
            pkgs.kdePackages.extra-cmake-modules
          ];

          extraBuildInputs = [
            pkgs.kdePackages.qtbase
            pkgs.kdePackages.qtdeclarative
          ];

          extraCmakeFlags = [
            "-DECM_DIR=${pkgs.kdePackages.extra-cmake-modules}/share/ECM/cmake"
            "-DCMAKE_EXPORT_COMPILE_COMMANDS=ON"
            "-DBUILD_TESTING=OFF"
            "-DKDE_INSTALL_QMLDIR=lib/qt-6/qml"
          ];

          passthru = {
            inherit
              pluginId
              version
              source
              ;
          };

          meta = {
            description = "A Plasma 6 pager experiment built with C++ and QML";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
