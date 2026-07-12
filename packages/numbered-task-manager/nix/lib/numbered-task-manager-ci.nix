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
    "${package}/lib/qt-6/qml"
    "${pkgs.kdePackages.qtdeclarative}/lib/qt-6/qml"
    "${pkgs.kdePackages.kconfig}/lib/qt-6/qml"
    "${pkgs.kdePackages.kirigami.unwrapped}/lib/qt-6/qml"
    "${pkgs.kdePackages.ksvg}/lib/qt-6/qml"
    "${pkgs.kdePackages.libplasma}/lib/qt-6/qml"
    "${pkgs.kdePackages.plasma-workspace}/lib/qt-6/qml"
  ];
  qmlImportFlags = lib.concatMapStringsSep " " (path: "-I ${lib.escapeShellArg path}") qmlImportPaths;
  qtPluginPaths = [
    "${pkgs.kdePackages.libplasma}/lib/qt-6/plugins"
  ];
  requiredPlasmoidFiles = [
    "metadata.json"
    "contents/ui/main.qml"
    "contents/ui/TaskItem.qml"
    "contents/ui/AttentionItem.qml"
    "contents/ui/TaskContextMenu.qml"
    "contents/ui/TaskFrame.qml"
    "contents/ui/ActivityScopeLogic.mjs"
    "contents/ui/LauncherListLogic.mjs"
    "contents/ui/TaskActivityLogic.mjs"
    "contents/ui/TaskContextMenuLogic.mjs"
    "contents/ui/TaskEntryLogic.mjs"
    "contents/ui/TaskItemPresentationLogic.mjs"
    "contents/ui/RemoteAttentionLogic.mjs"
    "contents/ui/TaskModelLogic.mjs"
    "contents/ui/TaskMetricsLogic.mjs"
    "contents/ui/TaskVisualLogic.mjs"
    "contents/ui/VisibleTaskItemsLogic.mjs"
    "contents/ui/NumberBadge.qml"
    "contents/config/main.xml"
  ];
  requiredPlasmoidFilesShell =
    lib.concatMapStringsSep "\n      " lib.escapeShellArg
      requiredPlasmoidFiles;

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
      -DNUMBERED_TASK_MANAGER_DBUS_SESSION_CONFIG=${pkgs.dbus}/share/dbus-1/session.conf \
      -DNUMBERED_TASK_MANAGER_QML_IMPORT_PATHS=${lib.escapeShellArg (lib.concatStringsSep ";" qmlImportPaths)} \
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

  jsLint = ''
    biome lint --error-on-warnings package/contents/ui/*.mjs tests/*.mjs
  '';

  jsTest = ''
    for test_file in tests/*.test.mjs
    do
      node "$test_file"
    done
  '';

  qmlSmoke = ''
    QT_QPA_PLATFORM=offscreen qml \
      -I "$install_prefix/lib/qt-6/qml" \
      ${qmlImportFlags} \
      tests/qml-js-module-smoke.qml
  '';

  qmlComponentTest = ''
    ctest --test-dir "$build_dir" --output-on-failure -R '^(qml_(component_tests|drag_integration_test)|plasma_applet_smoke)$'
  '';

  nativePackageSmoke = ''
    packaged_adapter="${package}/share/plasma/plasmoids/${package.pluginId}/contents/ui/TaskContextMenuAdapter.qml"
    test -f "$packaged_adapter"
    test -f "${package}/lib/qt-6/qml/${package.qmlModuleDir}/qmldir"
    test -f "${package}/lib/qt-6/qml/${package.qmlModuleDir}/libnumberedtaskmanagerplugin.so"

    QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software \
      ${pkgs.coreutils}/bin/timeout 30s \
      qml \
      ${qmlImportFlags} \
      tests/native-package-smoke.qml \
      -- "$packaged_adapter"
  '';

  qmlLint = ''
    mapfile -t qml_sources < <(${pkgs.findutils}/bin/find package/contents/ui -name '*.qml' -print | sort)
    mapfile -t installed_qml_sources < <(${pkgs.findutils}/bin/find "$install_prefix/share/plasma/plasmoids/${package.pluginId}/contents/ui" -name '*.qml' -print | sort)
    qml_sources+=("''${installed_qml_sources[@]}")

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

  packageLayout = ''
    installed_plasmoid="$install_prefix/share/plasma/plasmoids/${package.pluginId}"
    installed_metainfo="$install_prefix/share/metainfo/${package.pluginId}.metainfo.xml"
    installed_license_dir="$install_prefix/share/licenses/numbered-task-manager"
    required_plasmoid_files=(
      ${requiredPlasmoidFilesShell}
    )
    for file in "''${required_plasmoid_files[@]}"
    do
      test -f "$installed_plasmoid/$file"
    done

    test -f "$install_prefix/lib/qt-6/qml/${package.qmlModuleDir}/qmldir"
    test -f "$install_prefix/lib/qt-6/qml/${package.qmlModuleDir}/libnumberedtaskmanagerplugin.so"
    test -f "$installed_license_dir/AGPL-3.0-or-later.txt"
    test -f "$installed_license_dir/CC0-1.0.txt"
    test -f "$installed_metainfo"
  '';

  appstream = ''
    installed_metainfo="$install_prefix/share/metainfo/${package.pluginId}.metainfo.xml"

    grep -q '<project_license>AGPL-3.0-or-later</project_license>' "$installed_metainfo"
    grep -q '<metadata_license>CC0-1.0</metadata_license>' "$installed_metainfo"
    appstreamcli validate --no-net "$installed_metainfo"
  '';

  kpackage = ''
    export HOME="$TMPDIR/home"
    export QT_PLUGIN_PATH="${pkgs.kdePackages.libplasma}/lib/qt-6/plugins''${QT_PLUGIN_PATH:+:$QT_PLUGIN_PATH}"
    mkdir -p "$HOME" "$TMPDIR/plasmoids"

    kpackagetool6 \
      --type Plasma/Applet \
      --packageroot "$TMPDIR/plasmoids" \
      --install "$install_prefix/share/plasma/plasmoids/${package.pluginId}"

    required_plasmoid_files=(
      ${requiredPlasmoidFilesShell}
    )
    for file in "''${required_plasmoid_files[@]}"
    do
      test -f "$TMPDIR/plasmoids/${package.pluginId}/$file"
    done
    kpackagetool6 --hash "$TMPDIR/plasmoids/${package.pluginId}"
  '';

  localRepoPreamble = ''
    set -euo pipefail

    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [ -d "$repo_root/packages/numbered-task-manager" ]; then
      cd "$repo_root/packages/numbered-task-manager"
    fi
  '';

  localBuildPreamble = localRepoPreamble + ''
    build_dir="''${NUMBERED_TASK_MANAGER_BUILD_DIR:-build}"
    install_prefix="''${NUMBERED_TASK_MANAGER_INSTALL_PREFIX:-$PWD/.numbered-task-manager-install}"
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
    pkgs.appstream
    pkgs.biome
    pkgs.clazy
    pkgs.cmake
    pkgs.dbus
    pkgs.findutils
    pkgs.kdePackages.extra-cmake-modules
    pkgs.kdePackages.kpackage
    pkgs.kdePackages.libplasma
    pkgs.kdePackages.plasma-workspace
    pkgs.llvmPackages.clang-tools
    pkgs.llvmPackages.clang-unwrapped
    pkgs.ninja
    pkgs.nodejs
    pkgs.python3
    pkgs.qt6.qtdeclarative
  ];

  checkBuildInputs = [
    pkgs.kdePackages.kconfig
    pkgs.kdePackages.kio
    pkgs.kdePackages.kservice
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

  mkDevCommandWithPreamble =
    preamble: name: text:
    pkgs.writeShellApplication {
      inherit name;
      runtimeInputs = devRuntimeInputs;
      text = preamble + text;
    };
  mkDevCommand = mkDevCommandWithPreamble localRepoPreamble;
  mkBuildDevCommand = mkDevCommandWithPreamble localBuildPreamble;

  clangdWrapper = pkgs.writeShellApplication {
    name = "numbered-task-manager-clangd";
    text = ''
      exec ${pkgs.llvmPackages.clang-tools}/bin/clangd \
        --query-driver=${clangToolchain}/bin/clang++,${clangToolchain}/bin/clang \
        "$@"
    '';
  };

  qmllsWrapper = pkgs.writeShellApplication {
    name = "numbered-task-manager-qmlls";
    runtimeInputs = devRuntimeInputs;
    text = localBuildPreamble + ''
      exec ${pkgs.kdePackages.qtdeclarative}/bin/qmlls \
        --no-cmake-calls \
        --build-dir "$build_dir" \
        -I "$install_prefix/lib/qt-6/qml" \
        -I "$PWD/package/contents/ui" \
        ${qmlImportFlags} \
        "$@"
    '';
  };
in
{
  inherit
    appstream
    checkBuildInputs
    checkNativeBuildInputs
    clazy
    clangTidy
    cmakeBuild
    cmakeConfigure
    cmakeInstall
    cmakeTest
    jsLint
    jsTest
    kpackage
    nativePackageSmoke
    packageLayout
    qmlImportPaths
    qmlComponentTest
    qmlLint
    qmlSmoke
    qtPluginPaths
    ;

  lspDevShellPackages = [
    clangdWrapper
    qmllsWrapper
    pkgs.git
    clangToolchain
  ];

  devShellPackages = [
    (mkBuildDevCommand "numbered-task-manager-configure" cmakeConfigure)
    (mkDevCommand "numbered-task-manager-test" ''
      ${jsTest}
    '')
    (mkBuildDevCommand "numbered-task-manager-test-cpp" ''
      ${cmakeConfigure}
      ${cmakeBuild}
      ${cmakeTest}
    '')
    (mkBuildDevCommand "numbered-task-manager-test-qml" ''
      ${localBuildAndInstall}
      ${qmlComponentTest}
    '')
    (mkBuildDevCommand "numbered-task-manager-lint" ''
      ${localBuildAndInstall}
      ${jsLint}
      ${qmlLint}
      ${clangTidy}
      ${clazy}
    '')
    (mkDevCommand "numbered-task-manager-lint-js" ''
      ${jsLint}
    '')
    (mkBuildDevCommand "numbered-task-manager-lint-qml" ''
      ${localBuildAndInstall}
      ${qmlLint}
    '')
    (mkBuildDevCommand "numbered-task-manager-lint-clang-tidy" ''
      ${cmakeConfigure}
      ${clangTidy}
    '')
    (mkBuildDevCommand "numbered-task-manager-lint-clazy" ''
      ${cmakeConfigure}
      ${clazy}
    '')
    (mkBuildDevCommand "numbered-task-manager-ci-local" ''
      ${localBuildAndInstall}
      ${cmakeTest}
      ${jsLint}
      ${jsTest}
      ${qmlSmoke}
      ${qmlComponentTest}
      ${qmlLint}
      ${clangTidy}
      ${clazy}
      ${packageLayout}
      ${nativePackageSmoke}
      ${appstream}
      ${kpackage}
    '')
  ];
}
