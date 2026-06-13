// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    id: root

    property var taskModel
    readonly property var launcherList: taskModel && taskModel.launcherList ? taskModel.launcherList : []

    function requestAddLauncher(launcherUrl) {
        return taskModel.requestAddLauncher(launcherUrl);
    }

    function requestRemoveLauncher(launcherUrl) {
        return taskModel.requestRemoveLauncher(launcherUrl);
    }
}
