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
        package = config.packages.kwin-run-or-raise;
        buildKPackage = pkgs.writeShellApplication {
          name = "build-kpackage";
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
                    if [[ -f "$dir/flake.nix" && -d "$dir/packages/kwin-run-or-raise" ]]; then
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

            plugin_id=${lib.escapeShellArg package.pluginId}
            version=${lib.escapeShellArg package.version}
            repo_root=$(find_checkout_root)
            package_root="$repo_root/packages/kwin-run-or-raise"
            archive_name="kwin-run-or-raise-$version.kwinscript"
            archive_path="$package_root/dist/$archive_name"

            if [[ ! -f "$package_root/package.json" ]]; then
                printf 'error: expected package root at %s\n' "$package_root" >&2
                exit 1
            fi

            out_path=$(nix build "path:$repo_root#kwin-run-or-raise" --no-link --print-out-paths)
            package_source="$out_path/share/kwin/scripts/$plugin_id"

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

            test -f "$data_home/kwin/scripts/$plugin_id/metadata.json"
            test -f "$data_home/kwin/scripts/$plugin_id/contents/code/main.js"
            test -f "$data_home/kwin/scripts/$plugin_id/contents/config/main.xml"
            test -f "$data_home/kwin/scripts/$plugin_id/contents/ui/config.ui"

            printf 'Created %s\n' "$archive_path"
          '';
        };
      in
      {
        devShells.kwin-run-or-raise = pkgs.mkShellNoCC {
          packages = config.plasmaExtensions.devShell.commonPackages ++ [
            buildKPackage
            pkgs.biome
            pkgs.kdePackages.kpackage
            pkgs.kdePackages.kwin
            pkgs.nodejs
            pkgs.zip
          ];

          shellHook = config.pre-commit.installationScript;
        };
      };
  };
}
