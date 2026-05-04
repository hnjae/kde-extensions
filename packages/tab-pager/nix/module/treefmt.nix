# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      { lib, pkgs, ... }:
      {
        plasmaExtensions.treefmt.overrides.tab-pager = {
          root = "packages/tab-pager";

          formatters.biome = {
            includes = [
              "*.json"
              "*.ts"
            ];
            command = lib.getExe pkgs.biome;
            options = [
              "format"
              "--write"
              "--config-path"
              "packages/tab-pager/biome.json"
              "--no-errors-on-unmatched"
            ];
          };
        };
      };
  };
}
