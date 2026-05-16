// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Controls as QtQuickControls
import org.kde.taskmanager as TaskManager
import "TaskHelpers.js" as TaskHelpers

QtQuickControls.Menu {
    id: root

    readonly property string nullActivityId: "00000000-0000-0000-0000-000000000000"
    readonly property bool hasTask: Boolean(taskModel) && hasValidModelIndex(task.modelIndex)
    readonly property bool hasWindowTask: hasTask && task.isWindow
    readonly property var desktopEntries: {
        const ids = Array.from(virtualDesktopInfo.desktopIds || []);
        const names = Array.from(virtualDesktopInfo.desktopNames || []);
        const entries = [];
        for (let i = 0; i < ids.length; ++i) {
            entries.push({
                id: ids[i],
                name: names[i] || "Desktop " + (i + 1).toString()
            });
        }
        return entries;
    }
    property var activityEntries: []
    property var launcherActivityList: []
    property var task: ({})
    property var taskModel

    signal pinRequested(string launcherUrl)
    signal unpinRequested(string launcherUrl)
    signal launcherActivitiesChanged

    function openForTask(taskData, item) {
        task = taskData || {};
        refreshActivities();
        refreshLauncherActivities();
        popup(item, 0, item.height);
    }

    function refreshActivities() {
        const ids = Array.from(activityInfo.runningActivities() || []);
        const entries = [];
        for (let i = 0; i < ids.length; ++i) {
            const id = String(ids[i]);
            entries.push({
                icon: activityInfo.activityIcon(id),
                id,
                name: activityInfo.activityName(id) || id
            });
        }
        activityEntries = entries;
    }

    function refreshLauncherActivities() {
        if (!taskModel || !task.launcherUrl) {
            launcherActivityList = [];
            return;
        }

        launcherActivityList = Array.from(taskModel.launcherActivities(task.launcherUrl) || []);
    }

    function stringListContains(list, value) {
        return TaskHelpers.stringListContains(list, value);
    }

    function hasValidModelIndex(modelIndex) {
        return Boolean(modelIndex) && (modelIndex.valid === undefined || modelIndex.valid);
    }

    function desktopId(desktop) {
        if (!desktop) {
            return "";
        }

        if (typeof desktop === "string") {
            return desktop;
        }

        if (desktop.id) {
            return String(desktop.id);
        }

        return String(desktop);
    }

    function desktopListContains(desktops, desktop) {
        const needle = desktopId(desktop);
        const values = Array.from(desktops || []);
        for (let i = 0; i < values.length; ++i) {
            if (desktopId(values[i]) === needle) {
                return true;
            }
        }

        return false;
    }

    function taskOnAllActivities() {
        return TaskHelpers.activitiesAreAll(task.activities || []);
    }

    function taskOnActivity(activityId) {
        return taskOnAllActivities() || stringListContains(task.activities || [], activityId);
    }

    function toggleTaskActivity(activityId) {
        if (!hasWindowTask) {
            return;
        }

        taskModel.requestActivities(task.modelIndex, TaskHelpers.taskActivitiesAfterToggle(task.activities || [], activityId));
    }

    function launcherPinnedToAllActivities() {
        return stringListContains(launcherActivityList, nullActivityId);
    }

    function launcherPinnedToActivity(activityId) {
        return launcherPinnedToAllActivities() || stringListContains(launcherActivityList, activityId);
    }

    function launcherPosition() {
        if (!taskModel || !task.launcherUrl) {
            return -1;
        }

        return taskModel.launcherPosition(task.launcherUrl);
    }

    function applyLauncherActivities(activities) {
        const position = launcherPosition();
        const nextLaunchers = TaskHelpers.launcherListWithActivitiesAt(taskModel.launcherList, position, activities);
        if (!nextLaunchers) {
            return false;
        }

        launcherActivityList = TaskHelpers.effectiveSerializedLauncherActivities(nextLaunchers[position]);
        if (TaskHelpers.launcherListsEqual(nextLaunchers, taskModel.launcherList)) {
            return false;
        }

        taskModel.launcherList = nextLaunchers;
        root.launcherActivitiesChanged();
        return true;
    }

    function setLauncherAllActivities() {
        if (!taskModel || !task.launcherUrl) {
            return;
        }

        const nextActivities = TaskHelpers.launcherActivitiesAfterAllToggle(launcherActivityList, activityInfo.currentActivity);
        if (nextActivities) {
            applyLauncherActivities(nextActivities);
        }
        refreshLauncherActivities();
    }

    function toggleLauncherActivity(activityId) {
        if (!taskModel || !task.launcherUrl) {
            return;
        }

        applyLauncherActivities(TaskHelpers.launcherActivitiesAfterToggle(launcherActivityList, activityId, activityInfo.currentActivity));
        refreshLauncherActivities();
    }

    QtQuick.Component.onCompleted: refreshActivities()

    TaskManager.ActivityInfo {
        id: activityInfo

        onCurrentActivityChanged: root.refreshActivities()
        onNamesOfRunningActivitiesChanged: root.refreshActivities()
        onNumberOfRunningActivitiesChanged: root.refreshActivities()
    }

    TaskManager.VirtualDesktopInfo {
        id: virtualDesktopInfo
    }

    QtQuickControls.MenuItem {
        enabled: root.task.launcherUrl && root.task.launcherUrl.length > 0
        text: root.task.hasLauncher ? "Unpin from Task Manager" : "Pin to Task Manager"

        onTriggered: {
            if (root.task.hasLauncher) {
                root.unpinRequested(root.task.launcherUrl);
            } else {
                root.pinRequested(root.task.launcherUrl);
            }
        }
    }

    QtQuickControls.Menu {
        id: launcherActivitiesMenu

        enabled: root.taskModel && root.task.launcherUrl
        title: "Launcher Activities"
        visible: root.task.hasLauncher && root.task.launcherUrl && root.activityEntries.length > 1

        QtQuickControls.MenuItem {
            checkable: true
            checked: root.launcherPinnedToAllActivities()
            text: "All Activities"

            onTriggered: {
                root.setLauncherAllActivities();
            }
        }

        QtQuick.Instantiator {
            active: launcherActivitiesMenu.visible
            model: root.activityEntries

            delegate: QtQuickControls.MenuItem {
                required property var modelData

                checkable: true
                checked: root.launcherPinnedToActivity(modelData.id)
                text: modelData.name

                onTriggered: {
                    root.toggleLauncherActivity(modelData.id);
                }
            }

            onObjectAdded: (index, object) => {
                launcherActivitiesMenu.insertItem(index + 1, object);
            }

            onObjectRemoved: (index, object) => {
                launcherActivitiesMenu.removeItem(object);
            }
        }
    }

    QtQuickControls.MenuSeparator {
        visible: launcherActivitiesMenu.visible || newInstanceItem.visible || root.hasWindowTask
    }

    QtQuickControls.MenuItem {
        id: newInstanceItem

        enabled: root.hasTask
        text: "New Instance"
        visible: root.task.canLaunchNewInstance || root.task.isLauncher

        onTriggered: {
            root.taskModel.requestNewInstance(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        enabled: root.hasWindowTask && root.task.isMovable
        text: "Move"
        visible: root.task.isWindow && root.task.isMovable

        onTriggered: {
            root.taskModel.requestMove(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        enabled: root.hasWindowTask && root.task.isResizable
        text: "Resize"
        visible: root.task.isWindow && root.task.isResizable

        onTriggered: {
            root.taskModel.requestResize(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isMinimized || false
        enabled: root.hasWindowTask && root.task.isMinimizable
        text: "Minimize"
        visible: root.task.isWindow && root.task.isMinimizable

        onTriggered: {
            root.taskModel.requestToggleMinimized(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isMaximized || false
        enabled: root.hasWindowTask && root.task.isMaximizable
        text: "Maximize"
        visible: root.task.isWindow && root.task.isMaximizable

        onTriggered: {
            root.taskModel.requestToggleMaximized(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isKeepAbove || false
        enabled: root.hasWindowTask
        text: "Keep Above Others"
        visible: root.task.isWindow

        onTriggered: {
            root.taskModel.requestToggleKeepAbove(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isKeepBelow || false
        enabled: root.hasWindowTask
        text: "Keep Below Others"
        visible: root.task.isWindow

        onTriggered: {
            root.taskModel.requestToggleKeepBelow(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isFullScreen || false
        enabled: root.hasWindowTask && root.task.fullScreenable
        text: "Fullscreen"
        visible: root.task.isWindow && root.task.fullScreenable

        onTriggered: {
            root.taskModel.requestToggleFullScreen(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isShaded || false
        enabled: root.hasWindowTask && root.task.isShadeable
        text: "Shade"
        visible: root.task.isWindow && root.task.isShadeable

        onTriggered: {
            root.taskModel.requestToggleShaded(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.hasNoBorder || false
        enabled: root.hasWindowTask && root.task.canSetNoBorder
        text: "No Border"
        visible: root.task.isWindow && root.task.canSetNoBorder

        onTriggered: {
            root.taskModel.requestToggleNoBorder(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuItem {
        checkable: true
        checked: root.task.isExcludedFromCapture || false
        enabled: root.hasWindowTask
        text: "Hide from Screencasts"
        visible: root.task.isWindow

        onTriggered: {
            root.taskModel.requestToggleExcludeFromCapture(root.task.modelIndex);
        }
    }

    QtQuickControls.Menu {
        id: virtualDesktopsMenu

        enabled: root.hasWindowTask && root.task.isVirtualDesktopsChangeable
        title: "Virtual Desktops"
        visible: root.task.isWindow && root.task.isVirtualDesktopsChangeable

        QtQuickControls.MenuItem {
            checkable: true
            checked: root.task.isOnAllVirtualDesktops || false
            text: "All Desktops"

            onTriggered: {
                root.taskModel.requestVirtualDesktops(root.task.modelIndex, []);
            }
        }

        QtQuick.Instantiator {
            active: virtualDesktopsMenu.visible
            model: root.desktopEntries

            delegate: QtQuickControls.MenuItem {
                required property var modelData

                checkable: true
                checked: root.task.isOnAllVirtualDesktops || root.desktopListContains(root.task.virtualDesktops || [], modelData.id)
                text: modelData.name

                onTriggered: {
                    root.taskModel.requestVirtualDesktops(root.task.modelIndex, [modelData.id]);
                }
            }

            onObjectAdded: (index, object) => {
                virtualDesktopsMenu.insertItem(index + 1, object);
            }

            onObjectRemoved: (index, object) => {
                virtualDesktopsMenu.removeItem(object);
            }
        }

        QtQuickControls.MenuItem {
            enabled: root.hasWindowTask
            text: "New Desktop"

            onTriggered: {
                root.taskModel.requestNewVirtualDesktop(root.task.modelIndex);
            }
        }
    }

    QtQuickControls.Menu {
        id: activitiesMenu

        enabled: root.hasWindowTask
        title: "Activities"
        visible: root.task.isWindow && root.activityEntries.length > 1

        QtQuickControls.MenuItem {
            checkable: true
            checked: root.taskOnAllActivities()
            text: "All Activities"

            onTriggered: {
                root.taskModel.requestActivities(root.task.modelIndex, []);
            }
        }

        QtQuick.Instantiator {
            active: activitiesMenu.visible
            model: root.activityEntries

            delegate: QtQuickControls.MenuItem {
                required property var modelData

                checkable: true
                checked: root.taskOnActivity(modelData.id)
                text: modelData.name

                onTriggered: {
                    root.toggleTaskActivity(modelData.id);
                }
            }

            onObjectAdded: (index, object) => {
                activitiesMenu.insertItem(index + 1, object);
            }

            onObjectRemoved: (index, object) => {
                activitiesMenu.removeItem(object);
            }
        }
    }

    QtQuickControls.MenuSeparator {
        visible: closeItem.visible
    }

    QtQuickControls.MenuItem {
        id: closeItem

        enabled: root.hasTask
        text: "Close"
        visible: root.task.isWindow && root.task.closable

        onTriggered: {
            root.taskModel.requestClose(root.task.modelIndex);
        }
    }
}
