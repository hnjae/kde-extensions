# Repository Guidelines

## Compatibility Policy

This is still pre-release. Do not spend effort preserving backward compatibility or writing migrations for existing user data, configuration, APIs, or internal formats unless explicitly requested.

## Commit Guidelines

- Write all commit messages using Conventional Commits, with a scope whenever a clear scope exists.
- When a change is localized to one tool, use that subproject name as the scope.

## Licensing & Configuration

This repository is AGPL-3.0-or-later and uses REUSE checks. New source files should include SPDX copyright and license headers; generated or metadata files should be covered in `REUSE.toml` when inline headers are not practical.
