#!/usr/bin/env -S just --justfile

set unstable
set lazy
set ignore-comments

_:
    @just --list

alias fmt := format

[group('ci')]
format:
    nix develop ".#default" --command treefmt

[group('ci')]
flake-check:
    nix flake check path:.

[group('nix')]
flake-show:
    nix flake show path:.

[group('nix')]
flake-update:
    nix flake update
    nix flake update --flake ./nix/partitions/dev
