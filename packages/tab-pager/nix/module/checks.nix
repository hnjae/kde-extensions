# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      {
        config,
        lib,
        pkgs,
        ...
      }:
      let
        package = config.packages.tab-pager;
        ci = import ../lib/tab-pager-ci.nix {
          inherit
            lib
            package
            pkgs
            ;
        };
      in
      {
        checks = {
          tab-pager-check = pkgs.stdenv.mkDerivation {
            pname = "tab-pager-check";
            inherit (package) version source;
            src = package.source;

            nativeBuildInputs = ci.checkNativeBuildInputs;
            buildInputs = ci.checkBuildInputs;

            dontConfigure = true;
            dontWrapQtApps = true;

            buildPhase = ''
              runHook preBuild

              build_dir=build
              install_prefix="$TMPDIR/install"

              ${ci.cmakeConfigure}
              ${ci.cmakeBuild}
              ${ci.cmakeTest}
              ${ci.cmakeInstall}
              ${ci.qmlLint}
              ${ci.clangTidy}
              ${ci.clazy}
              ${ci.kpackage}

              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              touch "$out"
              runHook postInstall
            '';
          };
        };
      };
  };
}
