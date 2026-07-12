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
        package = config.packages.numbered-task-manager;
        ci = import ../lib/numbered-task-manager-ci.nix {
          inherit
            lib
            package
            pkgs
            ;
        };
      in
      {
        checks.numbered-task-manager-check = pkgs.stdenv.mkDerivation {
          pname = "numbered-task-manager-check";
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
            ${ci.jsLint}
            ${ci.jsTest}
            ${ci.qmlSmoke}
            ${ci.qmlComponentTest}
            ${ci.qmlLint}
            ${ci.clangTidy}
            ${ci.clazy}
            ${ci.packageLayout}
            ${ci.nativePackageSmoke}
            ${ci.appstream}
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
}
