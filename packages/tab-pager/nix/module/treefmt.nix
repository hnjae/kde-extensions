# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  partitions.dev.module = {
    perSystem =
      { pkgs, ... }:
      {
        plasmaExtensions.treefmt.overrides.tab-pager = {
          root = "packages/tab-pager";

          formatters.clang-format = {
            includes = [
              "**/*.cpp"
              "**/*.h"
            ];
            command = "${pkgs.clang-tools}/bin/clang-format";
            options = [
              "-i"
            ];
          };
        };
      };
  };
}
