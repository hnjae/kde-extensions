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
        buildKPackage = pkgs.writeShellApplication {
          name = "numbered-task-manager-build-kpackage";
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
                    if [[ -f "$dir/flake.nix" && -d "$dir/packages/numbered-task-manager" ]]; then
                        printf '%s\n' "$dir"
                        return 0
                    fi

                    if [[ -f "$dir/flake-module.nix" && -f "$dir/package/metadata.json" && -d "$dir/nix/module" ]]; then
                        realpath "$dir/../.."
                        return 0
                    fi

                    dir=$(dirname "$dir")
                done

                printf 'error: could not find the kde-plasma-extensions checkout root from %s\n' "$PWD" >&2
                return 1
            }

            plugin_id=${lib.escapeShellArg package.pluginId}
            version=${lib.escapeShellArg package.version}
            repo_root=$(find_checkout_root)
            package_root="$repo_root/packages/numbered-task-manager"
            archive_name="numbered-task-manager-$version.plasmoid"
            archive_path="$package_root/dist/$archive_name"

            if [[ ! -f "$package_root/package/metadata.json" ]]; then
                printf 'error: expected package root at %s\n' "$package_root" >&2
                exit 1
            fi

            out_path=$(nix build "path:$repo_root#numbered-task-manager" --no-link --print-out-paths)
            package_source="$out_path/share/plasma/plasmoids/$plugin_id"

            if [[ ! -d "$package_source" ]]; then
                printf 'error: built plasmoid package not found at %s\n' "$package_source" >&2
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

            HOME="$home_dir" XDG_DATA_HOME="$data_home" kpackagetool6 --type Plasma/Applet --install "$archive_path"

            installed_plasmoid="$data_home/plasma/plasmoids/$plugin_id"
            test -f "$installed_plasmoid/metadata.json"
            test -f "$installed_plasmoid/contents/ui/main.qml"
            test -f "$installed_plasmoid/contents/ui/TaskItem.qml"
            test -f "$installed_plasmoid/contents/config/main.xml"
            kpackagetool6 --hash "$installed_plasmoid" >/dev/null

            printf 'Created %s\n' "$archive_path"
          '';
        };
      in
      {
        plasmaExtensions.devShell.packages = [
          buildKPackage
        ]
        ++ ci.lspDevShellPackages
        ++ ci.devShellPackages
        ++ [
          pkgs.zip
        ]
        ++ ci.checkNativeBuildInputs
        ++ ci.checkBuildInputs;

        plasmaExtensions.devShell.qmlImportPaths = ci.qmlImportPaths;
        plasmaExtensions.devShell.qtPluginPaths = ci.qtPluginPaths;
      };
  };
}
