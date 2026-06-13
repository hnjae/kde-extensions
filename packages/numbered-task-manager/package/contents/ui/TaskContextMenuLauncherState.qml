// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskContextMenuPinLogic.mjs" as TaskContextMenuPinLogic

QtQuick.QtObject {
    id: root

    property string currentActivity: ""
    property var launcherModel
    property string launcherUrl: ""

    readonly property var launcherList: launcherModel ? launcherModel.launcherList : []
    readonly property int launcherPosition: launcherPositionForUrl()
    readonly property var pinState: TaskContextMenuPinLogic.launcherPinStateSnapshot(launcherList, launcherUrl, currentActivity, launcherPositionForPinnedUrl)

    function launcherPositionForPinnedUrl(pinnedUrl) {
        if (!launcherModel) {
            return -1;
        }

        return launcherModel.launcherPosition(pinnedUrl);
    }

    function launcherPositionForUrl() {
        if (!launcherModel || !launcherUrl) {
            return -1;
        }

        return launcherModel.launcherPosition(launcherUrl);
    }
}
