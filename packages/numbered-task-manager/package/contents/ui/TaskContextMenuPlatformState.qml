// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.taskmanager as TaskManager
import "TaskContextMenuLogic.js" as TaskContextMenuLogic

QtQuick.QtObject {
    id: root

    readonly property var currentActivity: activityInfo.currentActivity
    property var activityEntries: []
    readonly property var desktopEntries: TaskContextMenuLogic.virtualDesktopEntriesSnapshot(virtualDesktopInfo.desktopIds, virtualDesktopInfo.desktopNames)

    function refreshActivities() {
        activityEntries = TaskContextMenuLogic.activityEntriesSnapshot(activityInfo.runningActivities(), id => activityInfo.activityName(id), id => activityInfo.activityIcon(id));
    }

    QtQuick.Component.onCompleted: refreshActivities()

    readonly property TaskManager.ActivityInfo _activityInfo: TaskManager.ActivityInfo {
        id: activityInfo

        onCurrentActivityChanged: root.refreshActivities()
        onNamesOfRunningActivitiesChanged: root.refreshActivities()
        onNumberOfRunningActivitiesChanged: root.refreshActivities()
    }

    readonly property TaskManager.VirtualDesktopInfo _virtualDesktopInfo: TaskManager.VirtualDesktopInfo {
        id: virtualDesktopInfo
    }
}
