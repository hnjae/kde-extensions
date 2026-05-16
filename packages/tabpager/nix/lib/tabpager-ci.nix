# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  lib,
  package,
  pkgs,
}:
let
  clangToolchain = pkgs.llvmPackages.clang;
  clangSupportFlagFiles = [
    "${clangToolchain}/nix-support/cc-cflags"
    "${clangToolchain}/nix-support/libcxx-cxxflags"
    "${clangToolchain}/nix-support/libc-cflags"
  ];
  qtAnalysisIncludeArgs = [
    "-isystem${pkgs.kdePackages.qtbase}/include"
    "-isystem${pkgs.kdePackages.qtdeclarative}/include"
  ];
  qmlImportPaths = [
    "${pkgs.kdePackages.qtdeclarative}/lib/qt-6/qml"
    "${pkgs.kdePackages.kconfig}/lib/qt-6/qml"
    "${pkgs.kdePackages.kirigami}/lib/qt-6/qml"
    "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
    "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
  ];
  qmlImportPath = lib.concatStringsSep ":" qmlImportPaths;
  qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;

  mkClangAnalysisArgs = extraArgFlag: ''
    clang_analysis_args=(
      ${lib.concatMapStringsSep "\n      " (
        arg: lib.escapeShellArg "${extraArgFlag}${arg}"
      ) qtAnalysisIncludeArgs}
    )
    for clang_support_flag_file in ${
      lib.concatMapStringsSep " " lib.escapeShellArg clangSupportFlagFiles
    }; do
      read -r -a clang_support_flags < "$clang_support_flag_file" || true
      for clang_support_flag in "''${clang_support_flags[@]}"; do
        clang_analysis_args+=("${extraArgFlag}''${clang_support_flag}")
      done
    done
  '';

  cmakeConfigure = ''
    cmake -S . -B "$build_dir" -G Ninja \
      -DCMAKE_C_COMPILER=${clangToolchain}/bin/clang \
      -DCMAKE_CXX_COMPILER=${clangToolchain}/bin/clang++ \
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
    mapfile -t qml_sources < <(${pkgs.findutils}/bin/find package/contents/ui -name '*.qml' -print | sort)

    qmllint \
      --ignore-settings \
      --max-warnings 0 \
      --unqualified disable \
      -I "$install_prefix/lib/qt-6/qml" \
      ${qmlImportFlags} \
      "''${qml_sources[@]}"
  '';

  clangTidy = ''
    ${mkClangAnalysisArgs "-extra-arg="}

    python3 ${pkgs.llvmPackages.clang-unwrapped}/bin/run-clang-tidy \
      -p "$build_dir" \
      -j "''${NIX_BUILD_CORES:-$(nproc)}" \
      -quiet \
      -clang-tidy-binary ${pkgs.llvmPackages.clang-tools}/bin/clang-tidy \
      -config-file .clang-tidy \
      "''${clang_analysis_args[@]}" \
      '.*(src|tests)/.*\.cpp'
  '';

  clazy = ''
    mapfile -t cxx_sources < <(${pkgs.findutils}/bin/find src tests -name '*.cpp' -print | sort)
    ${mkClangAnalysisArgs "--extra-arg="}

    clazy-standalone \
      -p "$build_dir" \
      --checks=level1 \
      --ignore-included-files \
      "''${clang_analysis_args[@]}" \
      "''${cxx_sources[@]}"
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
    test -f "$install_prefix/lib/qt-6/qml/io/github/hnjae/tabpager/qmldir"
    test -f "$install_prefix/lib/qt-6/qml/io/github/hnjae/tabpager/libtabpagerplugin.so"
    kpackagetool6 --hash "$TMPDIR/plasmoids/${package.pluginId}"
  '';

  localPreamble = ''
    set -euo pipefail

    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [ -d "$repo_root/packages/tabpager" ]; then
      cd "$repo_root/packages/tabpager"
    fi

    build_dir="''${TABPAGER_BUILD_DIR:-build}"
    install_prefix="''${TABPAGER_INSTALL_PREFIX:-$PWD/.tabpager-install}"
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
    clangToolchain
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
    pkgs.kdePackages.kitemmodels
    pkgs.kdePackages.plasma-workspace
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

  clangdWrapper = pkgs.writeShellApplication {
    name = "clangd";
    text = ''
      exec ${pkgs.llvmPackages.clang-tools}/bin/clangd \
        --query-driver=${clangToolchain}/bin/clang++,${clangToolchain}/bin/clang \
        "$@"
    '';
  };

  qmllsWrapper = pkgs.writeShellApplication {
    name = "qmlls";
    text = localPreamble + ''
      exec ${pkgs.kdePackages.qtdeclarative}/bin/qmlls \
        --no-cmake-calls \
        --build-dir "$build_dir" \
        -I "$install_prefix/lib/qt-6/qml" \
        ${qmlImportFlags} \
        "$@"
    '';
  };

  devShellHook = ''
    tabpager_project_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [ -d "$tabpager_project_dir/packages/tabpager" ]; then
      tabpager_project_dir="$tabpager_project_dir/packages/tabpager"
    fi

    tabpager_build_dir="''${TABPAGER_BUILD_DIR:-$tabpager_project_dir/build}"
    tabpager_install_prefix="''${TABPAGER_INSTALL_PREFIX:-$tabpager_project_dir/.tabpager-install}"

    export QML_IMPORT_PATH="$tabpager_install_prefix/lib/qt-6/qml:${qmlImportPath}''${QML_IMPORT_PATH:+:$QML_IMPORT_PATH}"
    export QML2_IMPORT_PATH="$QML_IMPORT_PATH"
    export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
    export CC="${clangToolchain}/bin/clang"
    export CXX="${clangToolchain}/bin/clang++"
    export TABPAGER_BUILD_DIR="$tabpager_build_dir"
    export TABPAGER_INSTALL_PREFIX="$tabpager_install_prefix"
  '';
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
    devShellHook
    kpackage
    qmlLint
    ;

  lspDevShellPackages = [
    clangdWrapper
    qmllsWrapper
    pkgs.git
    clangToolchain
  ];

  devShellPackages = [
    (mkDevCommand "tabpager-configure" cmakeConfigure)
    (mkDevCommand "tabpager-test" ''
      ${cmakeConfigure}
      ${cmakeBuild}
      ${cmakeTest}
    '')
    (mkDevCommand "tabpager-lint" ''
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
    (mkDevCommand "tabpager-ci-local" ''
      ${localBuildAndInstall}
      ${cmakeTest}
      ${qmlLint}
      ${clangTidy}
      ${clazy}
      ${kpackage}
    '')
  ];
}
