// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQml as QtQml

QtQml.QtObject {
    id: root

    property var configuration
    property var taskModel
    readonly property var configLaunchers: configuration && configuration.launchers ? configuration.launchers : []
    readonly property var modelLaunchers: taskModel && taskModel.launcherList ? taskModel.launcherList : []

    function writeConfigLaunchers(launchers) {
        configuration.launchers = launchers;
    }

    function writeModelLaunchers(launchers) {
        taskModel.launcherList = launchers;
    }
}
