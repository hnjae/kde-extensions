# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  lib,
  package,
  pkgs,
}:
let
  qmlImportPaths = [
    "${pkgs.kdePackages.qtdeclarative}/lib/qt-6/qml"
    "${pkgs.kdePackages.kconfig}/lib/qt-6/qml"
    "${pkgs.kdePackages.kirigami}/lib/qt-6/qml"
    "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
    "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
  ];
  qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;
  gccIncludeDir = "${pkgs.stdenv.cc.cc}/include/c++/${lib.getVersion pkgs.stdenv.cc.cc}";

  cmakeConfigure = ''
    cmake -S . -B "$build_dir" -G Ninja \
      -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
      -DBUILD_TESTING=ON \
      -DKDE_INSTALL_QMLDIR=lib/qt-6/qml \
      -DCMAKE_INSTALL_PREFIX="$install_prefix"
  '';

  cmakeBuild = ''
    cmake --build "$build_dir"
  '';

  cmakeTest = ''
    ctest --test-dir "$build_dir" --output-on-failure
  '';

  cmakeInstall = ''
    cmake --install "$build_dir"
  '';

  qmlLint = ''
    qmllint \
      --ignore-settings \
      --max-warnings 0 \
      --unqualified disable \
      -I "$install_prefix/lib/qt-6/qml" \
      ${qmlImportFlags} \
      package/contents/ui/main.qml
  '';

  clangTidy = ''
    python3 ${pkgs.llvmPackages.clang-unwrapped}/bin/run-clang-tidy \
      -p "$build_dir" \
      -j "''${NIX_BUILD_CORES:-$(nproc)}" \
      -quiet \
      -clang-tidy-binary ${pkgs.llvmPackages.clang-tools}/bin/clang-tidy \
      -config-file .clang-tidy \
      -extra-arg=-I${pkgs.kdePackages.qtbase}/include \
      -extra-arg=-I${pkgs.kdePackages.qtdeclarative}/include \
      '.*(src|tests)/.*\.cpp'
  '';

  clazy = ''
    clazy-standalone \
      -p "$build_dir" \
      --checks=level1 \
      --ignore-included-files \
      --extra-arg=-I${pkgs.kdePackages.qtbase}/include \
      --extra-arg=-I${pkgs.kdePackages.qtdeclarative}/include \
      --extra-arg=-I${gccIncludeDir} \
      --extra-arg=-I${gccIncludeDir}/${pkgs.stdenv.hostPlatform.config} \
      --extra-arg=-I${pkgs.stdenv.cc.libc_dev}/include \
      src/hello.cpp \
      src/tabpagerbackend.cpp \
      src/tabpagerplugin.cpp \
      tests/tabpagerbackend_test.cpp
  '';

  kpackage = ''
    export HOME="$TMPDIR/home"
    export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
    mkdir -p "$HOME" "$TMPDIR/plasmoids"

    kpackagetool6 \
      --type Plasma/Applet \
      --packageroot "$TMPDIR/plasmoids" \
      --install "$install_prefix/share/plasma/plasmoids/${package.pluginId}"

    test -f "$TMPDIR/plasmoids/${package.pluginId}/metadata.json"
    test -f "$TMPDIR/plasmoids/${package.pluginId}/contents/ui/main.qml"
    test -f "$install_prefix/lib/qt-6/qml/com/example/plasmaextensions/tabpager/qmldir"
    test -f "$install_prefix/lib/qt-6/qml/com/example/plasmaextensions/tabpager/libtabpagerplugin.so"
    kpackagetool6 --hash "$TMPDIR/plasmoids/${package.pluginId}"
  '';

  localPreamble = ''
    set -euo pipefail

    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [ -d "$repo_root/packages/tab-pager" ]; then
      cd "$repo_root/packages/tab-pager"
    fi

    build_dir="''${TAB_PAGER_BUILD_DIR:-build}"
    install_prefix="''${TAB_PAGER_INSTALL_PREFIX:-$PWD/.tab-pager-install}"
    if [ -z "''${TMPDIR:-}" ]; then
      TMPDIR="$(mktemp -d)"
      export TMPDIR
      trap 'rm -rf "$TMPDIR"' EXIT
    fi
  '';

  localBuildAndInstall = ''
    ${cmakeConfigure}
    ${cmakeBuild}
    rm -rf "$install_prefix"
    ${cmakeInstall}
  '';

  checkNativeBuildInputs = [
    pkgs.cmake
    pkgs.clazy
    pkgs.kdePackages.extra-cmake-modules
    pkgs.kdePackages.kpackage
    pkgs.kdePackages.libplasma
    pkgs.llvmPackages.clang-tools
    pkgs.llvmPackages.clang-unwrapped
    pkgs.ninja
    pkgs.python3
    pkgs.qt6.qtdeclarative
  ];

  checkBuildInputs = [
    pkgs.kdePackages.qtbase
    pkgs.kdePackages.qtdeclarative
  ];

  devRuntimeInputs =
    checkNativeBuildInputs
    ++ checkBuildInputs
    ++ [
      pkgs.coreutils
      pkgs.git
    ];

  mkDevCommand =
    name: text:
    pkgs.writeShellApplication {
      inherit name;
      runtimeInputs = devRuntimeInputs;
      text = localPreamble + text;
    };
in
{
  inherit
    checkBuildInputs
    checkNativeBuildInputs
    clazy
    clangTidy
    cmakeBuild
    cmakeConfigure
    cmakeInstall
    cmakeTest
    kpackage
    qmlLint
    ;

  devShellPackages = [
    (mkDevCommand "tab-pager-configure" cmakeConfigure)
    (mkDevCommand "tab-pager-test" ''
      ${cmakeConfigure}
      ${cmakeBuild}
      ${cmakeTest}
    '')
    (mkDevCommand "tab-pager-lint" ''
      ${localBuildAndInstall}
      ${qmlLint}
      ${clangTidy}
      ${clazy}
    '')
    (mkDevCommand "lint-qml" ''
      ${localBuildAndInstall}
      ${qmlLint}
    '')
    (mkDevCommand "lint-clang-tidy" ''
      ${cmakeConfigure}
      ${clangTidy}
    '')
    (mkDevCommand "lint-clazy" ''
      ${cmakeConfigure}
      ${clazy}
    '')
    (mkDevCommand "tab-pager-ci-local" ''
      ${localBuildAndInstall}
      ${cmakeTest}
      ${qmlLint}
      ${clangTidy}
      ${clazy}
      ${kpackage}
    '')
  ];
}
