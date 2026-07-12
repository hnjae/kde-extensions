// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.taskmanager as TaskManager
import "ActivityScopeLogic.mjs" as ActivityScopeLogic
import "LauncherPinLogic.mjs" as LauncherPinLogic

QtQuick.QtObject {
    id: root

    required property var taskModel
    property var activityInfo: defaultActivityInfo
    property var virtualDesktopInfo: defaultVirtualDesktopInfo
    readonly property string currentActivity: root.activityInfo.currentActivity
    readonly property var currentDesktop: root.virtualDesktopInfo.currentDesktop
    property int launcherRevision: 0

    function noteLauncherListChanged() {
        root.launcherRevision += 1;
    }

    function visibleLauncherPosition(launcherUrl, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? root.launcherRevision : launcherRevisionToken;
        if (!launcherUrl) {
            return -1;
        }

        if (revision < 0) {
            return -1;
        }

        return LauncherPinLogic.visibleLauncherPosition(root.taskModel.launcherList, launcherUrl, root.currentActivity, url => root.taskModel.launcherPosition(url));
    }

    function isInCurrentActivity(activities) {
        return ActivityScopeLogic.isInCurrentActivity(activities, root.currentActivity);
    }

    readonly property TaskManager.ActivityInfo _defaultActivityInfo: TaskManager.ActivityInfo {
        id: defaultActivityInfo
    }

    readonly property TaskManager.VirtualDesktopInfo _defaultVirtualDesktopInfo: TaskManager.VirtualDesktopInfo {
        id: defaultVirtualDesktopInfo
    }

    readonly property QtQuick.Connections _activityInfoConnections: QtQuick.Connections {
        target: root.activityInfo

        function onCurrentActivityChanged() {
            root.launcherRevision += 1;
        }
    }
}
