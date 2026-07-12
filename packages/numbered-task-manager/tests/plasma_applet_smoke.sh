#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later

set -euo pipefail

timeout_command=$1
dbus_run_session_command=$2
dbus_session_config=$3
plasmawindowed_command=$4
package_path=$5

set +e
"$timeout_command" 3s "$dbus_run_session_command" --config-file="$dbus_session_config" -- "$plasmawindowed_command" "$package_path"
status=$?
set -e

if [[ $status -ne 124 ]]; then
    exit "$status"
fi
