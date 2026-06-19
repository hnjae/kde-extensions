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
    readonly property string currentActivity: activityInfo.currentActivity
    readonly property var currentDesktop: virtualDesktopInfo.currentDesktop
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

    readonly property TaskManager.ActivityInfo _activityInfo: TaskManager.ActivityInfo {
        id: activityInfo

        onCurrentActivityChanged: {
            root.launcherRevision += 1;
        }
    }

    readonly property TaskManager.VirtualDesktopInfo _virtualDesktopInfo: TaskManager.VirtualDesktopInfo {
        id: virtualDesktopInfo
    }
}
