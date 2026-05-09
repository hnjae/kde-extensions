# Repository Guidelines

## Compatibility Policy

This is still pre-release. Do not spend effort preserving backward compatibility or writing migrations for existing user data, configuration, APIs, or internal formats unless explicitly requested.

## Commit & Pull Request Guidelines

Use Conventional Commit style, such as `feat: init project`. After completing a requested repository change, create a commit before ending the task unless the user explicitly asks not to commit or asks to pause. Check `git status` before committing and stage paths explicitly. Do not include
unrelated user changes in these commits.

## Licensing & Configuration

This repository is AGPL-3.0-or-later and uses REUSE checks. New source files should include SPDX copyright and license headers; generated or metadata files should be covered in `REUSE.toml` when inline headers are not practical.
