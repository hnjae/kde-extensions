# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later
{ config }:
let
  package = config.packages.sample;
in
{
  inherit package;
  inherit (package)
    pluginId
    source
    version
    ;
}
