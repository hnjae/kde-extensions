# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  description = "A collection of Plasma extensions.";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0"; # Most recently published stable
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
      ];

      imports = [
        inputs.flake-parts.flakeModules.partitions

        ./nix/modules/devshell.nix
        ./nix/modules/treefmt.nix
        ./packages/kwin-ime-refocus/flake-module.nix
        ./packages/kwin-run-or-raise/flake-module.nix
        ./packages/numbered-task-manager/flake-module.nix
        ./packages/tab-pager/flake-module.nix
      ];

      partitionedAttrs = {
        checks = "dev";
        devShells = "dev";
        formatter = "dev";
      };

      partitions.dev.extraInputsFlake = ./nix/partitions/dev;
      partitions.dev.module =
        { inputs, ... }:
        {
          imports = [
            inputs.git-hooks-nix.flakeModule
            inputs.treefmt-nix.flakeModule
          ];
        };
    };
}
