# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  flake-parts-lib,
  lib,
  ...
}:
let
  inherit (lib) types;

  projectRootPath = ../..;
  projectRootString = toString projectRootPath;
  ignoredPathNames = [
    ".devenv"
    ".direnv"
    ".git"
    ".pre-commit-config.yaml"
    ".rumdl_cache"
  ];

  projectRoot = builtins.path {
    name = "kde-plasma-extensions-treefmt-source";
    path = projectRootPath;
    filter =
      path: _type:
      let
        pathString = toString path;
        relativePath = lib.removePrefix "${projectRootString}/" pathString;
        segments = lib.splitString "/" relativePath;
        packageLocalName =
          if builtins.length segments >= 3 && builtins.elemAt segments 0 == "packages" then
            builtins.elemAt segments 2
          else
            "";
      in
      !lib.any (name: builtins.elem name ignoredPathNames) segments
      && packageLocalName != "build"
      && !(lib.hasPrefix "." packageLocalName && lib.hasSuffix "-install" packageLocalName);
  };

  formatterOverrideType = types.submodule {
    options = {
      command = lib.mkOption {
        type = types.oneOf [
          types.package
          types.path
          types.str
        ];
        description = "Executable obeying the treefmt formatter spec.";
      };

      includes = lib.mkOption {
        type = types.listOf types.str;
        description = "File globs, relative to the override root, handled by this formatter.";
      };

      excludes = lib.mkOption {
        type = types.listOf types.str;
        default = [ ];
        description = "File globs, relative to the override root, excluded from this formatter.";
      };

      options = lib.mkOption {
        type = types.listOf types.str;
        default = [ ];
        description = "Arguments passed to the formatter command before filenames.";
      };
    };
  };

  overrideType = types.submodule {
    options = {
      root = lib.mkOption {
        type = types.str;
        description = "Repository-relative root path for this override.";
        example = "packages/tab-pager";
      };

      formatters = lib.mkOption {
        type = types.attrsOf formatterOverrideType;
        default = { };
        description = "Formatter overrides scoped to this root.";
      };
    };
  };
in
{
  partitions.dev.module = {
    options.perSystem = flake-parts-lib.mkPerSystemOption (_: {
      options.plasmaExtensions.treefmt.overrides = lib.mkOption {
        type = types.attrsOf overrideType;
        default = { };
        description = "Per-subproject treefmt formatter overrides.";
      };
    });

    config.perSystem =
      { config, pkgs, ... }:
      let
        cfg = config.plasmaExtensions.treefmt;

        prefixGlob =
          root: pattern:
          let
            cleanRoot = lib.removeSuffix "/" root;
            cleanPattern = lib.removePrefix "/" pattern;
          in
          if cleanRoot == "" then cleanPattern else "${cleanRoot}/${cleanPattern}";

        prefixGlobs = root: patterns: map (prefixGlob root) patterns;

        overrideEntries = lib.flatten (
          lib.mapAttrsToList (
            overrideName: override:
            lib.mapAttrsToList (formatterName: formatter: {
              inherit
                formatter
                formatterName
                override
                overrideName
                ;
            }) override.formatters
          ) cfg.overrides
        );

        mkOverrideFormatter =
          entry:
          entry.formatter
          // {
            includes = prefixGlobs entry.override.root entry.formatter.includes;
            excludes = prefixGlobs entry.override.root entry.formatter.excludes;
          };

        overrideFormatterSettings = lib.listToAttrs (
          map (
            entry: lib.nameValuePair "${entry.formatterName}-${entry.overrideName}" (mkOverrideFormatter entry)
          ) overrideEntries
        );

        globalOverrideExcludes = lib.foldl' (
          acc: entry:
          let
            formatterExcludes = acc.${entry.formatterName}.excludes or [ ];
          in
          acc
          // {
            ${entry.formatterName}.excludes =
              formatterExcludes ++ prefixGlobs entry.override.root entry.formatter.includes;
          }
        ) { } overrideEntries;
      in
      {
        treefmt = {
          inherit projectRoot;

          projectRootFile = "flake.nix";

          programs = {
            biome = {
              enable = true;
              formatCommand = "format";
              settings.formatter = {
                indentStyle = "space";
                indentWidth = 2;
              };
            };

            deadnix = {
              enable = true;
              priority = 10;
            };

            just.enable = true;
            nixfmt = {
              enable = true;
              priority = 30;
            };
            qmlformat.enable = true;
            statix = {
              enable = true;
              disabled-lints = [
                "manual_inherit"
                "manual_inherit_from"
                "repeated_keys"
              ];
              priority = 20;
            };
            taplo.enable = true;

            yamlfmt = {
              enable = true;
              settings.formatter = {
                include_document_start = true;
                indent = 2;
                scan_folded_as_literal = true;
              };
            };
          };

          settings.formatter =
            globalOverrideExcludes
            // {
              clang-format = {
                command = "${pkgs.clang-tools}/bin/clang-format";
                includes = [
                  "*.cpp"
                  "*.h"
                  "*.hpp"
                ];
              };

              shell-fmt = {
                command = lib.getExe (
                  pkgs.writeShellScriptBin "treefmt-shell-fmt" ''
                    set -euo pipefail

                    for file in "$@"; do
                      ${lib.getExe pkgs.shellharden} --replace "$file"
                      ${lib.getExe pkgs.shfmt} --indent 4 --simplify --write "$file"
                    done
                  ''
                );
                includes = [
                  "*.bash"
                  "*.env"
                  "*.env.*"
                  "*.envrc"
                  "*.envrc.*"
                  "*.sh"
                ];
              };
            }
            // overrideFormatterSettings;
        };
      };
  };
}
