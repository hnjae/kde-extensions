# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  perSystem =
    { lib, pkgs, ... }:
    {
      packages.tab-pager =
        let
          clangToolchain = pkgs.llvmPackages.clang;
          pluginId = "io.github.hnjae.tabpager";
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
          pname = "tab-pager";
          inherit version source;
          src = source;

          extraNativeBuildInputs = [
            clangToolchain
            pkgs.kdePackages.extra-cmake-modules
          ];

          extraBuildInputs = [
            pkgs.kdePackages.kitemmodels
            pkgs.kdePackages.plasma-workspace
            pkgs.kdePackages.qtbase
            pkgs.kdePackages.qtdeclarative
          ];

          extraCmakeFlags = [
            "-DCMAKE_C_COMPILER=${clangToolchain}/bin/clang"
            "-DCMAKE_CXX_COMPILER=${clangToolchain}/bin/clang++"
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
            description = "A Plasma 6 widget for switching between virtual desktops";
            homepage = "https://github.com/hnjae/kde-plasma-extensions";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.linux;
          };
        };
    };
}
