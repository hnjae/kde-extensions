# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{
  description = "A collection of Plasma extensions.";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/DeterminateSystems/nixpkgs-weekly/0"; # Stable
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
