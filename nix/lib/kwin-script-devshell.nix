# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  lib,
  package,
  packageAttr,
  packagePath,
  pkgs,
}:
let
  pluginId = package.pluginId;
  packageName = package.packageName;
  version = package.version;
  installPath = package.kwinScriptInstallPath or "share/kwin/scripts/${pluginId}";
  requiredFiles =
    package.kpackageCheckFiles or [
      "metadata.json"
      "contents/${package.mainScriptRelativePath}"
    ];
in
pkgs.writeShellApplication {
  name = "${packageAttr}-build-kpackage";
  runtimeInputs = [
    pkgs.coreutils
    pkgs.kdePackages.kpackage
    pkgs.nix
    pkgs.zip
  ];
  text = ''
    find_checkout_root() {
        local dir
        dir=$(pwd -P)

        while [[ "$dir" != "/" ]]; do
            if [[ -f "$dir/flake.nix" && -d "$dir/${packagePath}" ]]; then
                printf '%s\n' "$dir"
                return 0
            fi

            if [[ -f "$dir/flake-module.nix" && -f "$dir/package.json" && -d "$dir/nix/module" ]]; then
                realpath "$dir/../.."
                return 0
            fi

            dir=$(dirname "$dir")
        done

        printf 'error: could not find the kde-plasma-extensions checkout root from %s\n' "$PWD" >&2
        return 1
    }

    plugin_id=${lib.escapeShellArg pluginId}
    package_name=${lib.escapeShellArg packageName}
    version=${lib.escapeShellArg version}
    repo_root=$(find_checkout_root)
    package_root="$repo_root/${packagePath}"
    archive_name="$package_name-$version.kwinscript"
    archive_path="$package_root/dist/$archive_name"

    if [[ ! -f "$package_root/package.json" ]]; then
        printf 'error: expected package root at %s\n' "$package_root" >&2
        exit 1
    fi

    out_path=$(nix build "path:$repo_root#${packageAttr}" --no-link --print-out-paths)
    package_source="$out_path/${installPath}"

    if [[ ! -d "$package_source" ]]; then
        printf 'error: built KWin script package not found at %s\n' "$package_source" >&2
        exit 1
    fi

    temp_dir=$(mktemp -d)
    cleanup() {
        chmod -R u+w "$temp_dir" 2>/dev/null || true
        rm -rf "$temp_dir"
    }
    trap cleanup EXIT

    staging_dir="$temp_dir/package"
    data_home="$temp_dir/share"
    home_dir="$temp_dir/home"

    mkdir -p "$staging_dir" "$data_home" "$home_dir" "$package_root/dist"
    cp -R --no-preserve=mode "$package_source/." "$staging_dir/"
    rm -f "$archive_path"

    (
        cd "$staging_dir"
        zip --quiet --recurse-paths "$archive_path" .
    )

    HOME="$home_dir" XDG_DATA_HOME="$data_home" kpackagetool6 --type=KWin/Script --install "$archive_path"

    installed_script="$data_home/kwin/scripts/$plugin_id"
    for required_file in ${lib.concatMapStringsSep " " lib.escapeShellArg requiredFiles}; do
        test -f "$installed_script/$required_file"
    done

    printf 'Created %s\n' "$archive_path"
  '';
}
