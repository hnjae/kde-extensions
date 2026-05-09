#!/usr/bin/env -S just --justfile

set unstable
set lazy
set ignore-comments

_:
    @just --list

alias fmt := format
alias ci := flake-check

[group('ci')]
format:
    nix develop ".#default" --command treefmt

[group('dev')]
pre-commit:
    nix develop ".#default" --command prek run --hook-stage pre-commit --all-files

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
