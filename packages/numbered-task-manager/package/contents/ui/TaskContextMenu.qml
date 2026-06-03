// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.extras as PlasmaExtras
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "TaskActivityLogic.js" as TaskActivityLogic
import "TaskContextMenuLogic.js" as TaskContextMenuLogic
import "TaskEntryLogic.js" as TaskEntryLogic
import "LauncherListLogic.js" as LauncherListLogic

// qmllint disable incompatible-type
PlasmaExtras.Menu {
    id: root

    readonly property var atm: TaskManager.AbstractTasksModel
    readonly property bool hasTask: Boolean(taskModel) && TaskEntryLogic.hasValidModelIndex(modelIndex)
    readonly property bool hasWindowTask: hasTask && isWindow()
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
    property var launcherModel: taskModel
    property var launcherActivityList: []
    property var modelIndex
    property var task: ({})
    property var taskModel
    property int visualParentWidth: 0

    minimumWidth: visualParentWidth
    placement: TaskContextMenuLogic.panelMenuPlacement(Plasmoid.location, PlasmaCore.Types, PlasmaExtras.Menu)

    signal pinRequested(string launcherUrl)
    signal unpinRequested(string launcherUrl)
    signal launcherListChangeRequested(var launchers)

    function show() {
        refreshActivities();
        refreshLauncherActivities();
        openRelative();
    }

    function roleData(role, fallback) {
        if (!hasTask) {
            return fallback;
        }

        const value = taskModel.data(modelIndex, role);
        return value === undefined || value === null ? fallback : value;
    }

    function boolRole(role, fallback) {
        return Boolean(roleData(role, fallback || false));
    }

    function launcherUrl() {
        return String(roleData(atm.LauncherUrlWithoutIcon, roleData(atm.LauncherUrl, task.launcherUrl || "")) || "");
    }

    function activities() {
        return Array.from(roleData(atm.Activities, task.activities || []) || []);
    }

    function virtualDesktops() {
        return Array.from(roleData(atm.VirtualDesktops, task.virtualDesktops || []) || []);
    }

    function isWindow() {
        return boolRole(atm.IsWindow, task.isWindow || false);
    }

    function isLauncher() {
        return boolRole(atm.IsLauncher, task.isLauncher || false);
    }

    function hasLauncher() {
        return boolRole(atm.HasLauncher, task.hasLauncher || false);
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
        const url = launcherUrl();
        if (!launcherModel || !url) {
            launcherActivityList = [];
            return;
        }

        launcherActivityList = Array.from(launcherModel.launcherActivities(url) || []);
    }

    function stringListContains(list, value) {
        return TaskActivityLogic.stringListContains(list, value);
    }

    function taskOnAllActivities() {
        return TaskActivityLogic.activitiesAreAll(activities());
    }

    function taskOnActivity(activityId) {
        return taskOnAllActivities() || stringListContains(activities(), activityId);
    }

    function toggleTaskActivity(activityId) {
        if (!hasWindowTask) {
            return;
        }

        taskModel.requestActivities(modelIndex, TaskActivityLogic.taskActivitiesAfterToggle(activities(), activityId));
    }

    function launcherPinnedToAllActivities() {
        return stringListContains(launcherActivityList, TaskActivityLogic.allActivitiesId());
    }

    function launcherPinnedToActivity(activityId) {
        return launcherPinnedToAllActivities() || stringListContains(launcherActivityList, activityId);
    }

    function launcherPosition() {
        const url = launcherUrl();
        if (!launcherModel || !url) {
            return -1;
        }

        return launcherModel.launcherPosition(url);
    }

    function applyLauncherActivities(activities) {
        const position = launcherPosition();
        const update = LauncherListLogic.launcherActivityUpdate(launcherModel.launcherList, position, activities);
        if (!update) {
            return false;
        }

        launcherActivityList = update.activities;
        if (!update.changed) {
            return false;
        }

        root.launcherListChangeRequested(update.launchers);
        return true;
    }

    function setLauncherAllActivities() {
        const url = launcherUrl();
        if (!launcherModel || !url) {
            return;
        }

        const nextActivities = LauncherListLogic.launcherActivitiesAfterAllToggle(launcherActivityList, activityInfo.currentActivity);
        if (nextActivities) {
            applyLauncherActivities(nextActivities);
        }
        refreshLauncherActivities();
    }

    function toggleLauncherActivity(activityId) {
        const url = launcherUrl();
        if (!launcherModel || !url) {
            return;
        }

        applyLauncherActivities(LauncherListLogic.launcherActivitiesAfterToggle(launcherActivityList, activityId, activityInfo.currentActivity));
        refreshLauncherActivities();
    }

    onStatusChanged: {
        if (status === PlasmaExtras.Menu.Closed) {
            destroy();
        }
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

    PlasmaExtras.MenuItem {
        enabled: root.launcherUrl().length > 0
        text: root.hasLauncher() ? "Unpin from Task Manager" : "Pin to Task Manager"

        onClicked: {
            const url = root.launcherUrl();
            if (root.hasLauncher()) {
                root.unpinRequested(url);
            } else {
                root.pinRequested(url);
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: launcherActivitiesItem

        enabled: root.taskModel && root.launcherUrl()
        text: "Launcher Activities"
        visible: root.hasLauncher() && root.launcherUrl() && root.activityEntries.length > 1

        readonly property PlasmaExtras.Menu _launcherActivitiesMenu: PlasmaExtras.Menu {
            id: launcherActivitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: launcherActivitiesItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: root.launcherPinnedToAllActivities()
                text: "All Activities"

                onClicked: {
                    root.setLauncherAllActivities();
                }
            }

            readonly property QtQuick.Instantiator _activityItems: QtQuick.Instantiator {
                active: launcherActivitiesItem.visible
                model: root.activityEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    checkable: true
                    checked: root.launcherPinnedToActivity(modelData.id)
                    text: modelData.name

                    onClicked: {
                        root.toggleLauncherActivity(modelData.id);
                    }
                }

                onObjectAdded: (index, object) => {
                    launcherActivitiesMenu.addMenuItem(object);
                }

                onObjectRemoved: (index, object) => {
                    launcherActivitiesMenu.removeMenuItem(object);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        separator: true
        visible: launcherActivitiesItem.visible || newInstanceItem.visible || root.hasWindowTask
    }

    PlasmaExtras.MenuItem {
        id: newInstanceItem

        enabled: root.hasTask
        text: "New Instance"
        visible: root.boolRole(root.atm.CanLaunchNewInstance, root.task.canLaunchNewInstance || false) || root.isLauncher()

        onClicked: {
            root.taskModel.requestNewInstance(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsMovable, root.task.isMovable || false)
        text: "Move"
        visible: root.isWindow() && root.boolRole(root.atm.IsMovable, root.task.isMovable || false)

        onClicked: {
            root.taskModel.requestMove(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsResizable, root.task.isResizable || false)
        text: "Resize"
        visible: root.isWindow() && root.boolRole(root.atm.IsResizable, root.task.isResizable || false)

        onClicked: {
            root.taskModel.requestResize(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsMinimized, root.task.isMinimized || false)
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsMinimizable, root.task.isMinimizable || false)
        text: "Minimize"
        visible: root.isWindow() && root.boolRole(root.atm.IsMinimizable, root.task.isMinimizable || false)

        onClicked: {
            root.taskModel.requestToggleMinimized(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsMaximized, root.task.isMaximized || false)
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsMaximizable, root.task.isMaximizable || false)
        text: "Maximize"
        visible: root.isWindow() && root.boolRole(root.atm.IsMaximizable, root.task.isMaximizable || false)

        onClicked: {
            root.taskModel.requestToggleMaximized(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsKeepAbove, root.task.isKeepAbove || false)
        enabled: root.hasWindowTask
        text: "Keep Above Others"
        visible: root.isWindow()

        onClicked: {
            root.taskModel.requestToggleKeepAbove(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsKeepBelow, root.task.isKeepBelow || false)
        enabled: root.hasWindowTask
        text: "Keep Below Others"
        visible: root.isWindow()

        onClicked: {
            root.taskModel.requestToggleKeepBelow(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsFullScreen, root.task.isFullScreen || false)
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsFullScreenable, root.task.fullScreenable || false)
        text: "Fullscreen"
        visible: root.isWindow() && root.boolRole(root.atm.IsFullScreenable, root.task.fullScreenable || false)

        onClicked: {
            root.taskModel.requestToggleFullScreen(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsShaded, root.task.isShaded || false)
        enabled: root.hasWindowTask && root.boolRole(root.atm.IsShadeable, root.task.isShadeable || false)
        text: "Shade"
        visible: root.isWindow() && root.boolRole(root.atm.IsShadeable, root.task.isShadeable || false)

        onClicked: {
            root.taskModel.requestToggleShaded(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.HasNoBorder, root.task.hasNoBorder || false)
        enabled: root.hasWindowTask && root.boolRole(root.atm.CanSetNoBorder, root.task.canSetNoBorder || false)
        text: "No Border"
        visible: root.isWindow() && root.boolRole(root.atm.CanSetNoBorder, root.task.canSetNoBorder || false)

        onClicked: {
            root.taskModel.requestToggleNoBorder(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        checkable: true
        checked: root.boolRole(root.atm.IsExcludedFromCapture, root.task.isExcludedFromCapture || false)
        enabled: root.hasWindowTask
        text: "Hide from Screencasts"
        visible: root.isWindow()

        onClicked: {
            root.taskModel.requestToggleExcludeFromCapture(root.modelIndex);
        }
    }

    PlasmaExtras.MenuItem {
        id: virtualDesktopsItem

        enabled: root.hasWindowTask && root.boolRole(root.atm.IsVirtualDesktopsChangeable, root.task.isVirtualDesktopsChangeable || false)
        text: "Virtual Desktops"
        visible: root.isWindow() && root.boolRole(root.atm.IsVirtualDesktopsChangeable, root.task.isVirtualDesktopsChangeable || false)

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: root.boolRole(root.atm.IsOnAllVirtualDesktops, root.task.isOnAllVirtualDesktops || false)
                text: "All Desktops"

                onClicked: {
                    root.taskModel.requestVirtualDesktops(root.modelIndex, []);
                }
            }

            readonly property QtQuick.Instantiator _desktopItems: QtQuick.Instantiator {
                active: virtualDesktopsItem.visible
                model: root.desktopEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    checkable: true
                    checked: root.boolRole(root.atm.IsOnAllVirtualDesktops, root.task.isOnAllVirtualDesktops || false) || TaskEntryLogic.desktopListContains(root.virtualDesktops(), modelData.id)
                    text: modelData.name

                    onClicked: {
                        root.taskModel.requestVirtualDesktops(root.modelIndex, [modelData.id]);
                    }
                }

                onObjectAdded: (index, object) => {
                    virtualDesktopsMenu.addMenuItem(object);
                }

                onObjectRemoved: (index, object) => {
                    virtualDesktopsMenu.removeMenuItem(object);
                }
            }

            PlasmaExtras.MenuItem {
                enabled: root.hasWindowTask
                text: "New Desktop"

                onClicked: {
                    root.taskModel.requestNewVirtualDesktop(root.modelIndex);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: activitiesItem

        enabled: root.hasWindowTask
        text: "Activities"
        visible: root.isWindow() && root.activityEntries.length > 1

        readonly property PlasmaExtras.Menu _activitiesMenu: PlasmaExtras.Menu {
            id: activitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: activitiesItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: root.taskOnAllActivities()
                text: "All Activities"

                onClicked: {
                    root.taskModel.requestActivities(root.modelIndex, []);
                }
            }

            readonly property QtQuick.Instantiator _activityItems: QtQuick.Instantiator {
                active: activitiesItem.visible
                model: root.activityEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    checkable: true
                    checked: root.taskOnActivity(modelData.id)
                    text: modelData.name

                    onClicked: {
                        root.toggleTaskActivity(modelData.id);
                    }
                }

                onObjectAdded: (index, object) => {
                    activitiesMenu.addMenuItem(object);
                }

                onObjectRemoved: (index, object) => {
                    activitiesMenu.removeMenuItem(object);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        separator: true
        visible: closeItem.visible
    }

    PlasmaExtras.MenuItem {
        id: closeItem

        enabled: root.hasTask
        text: "Close"
        visible: root.isWindow() && root.boolRole(root.atm.IsClosable, root.task.closable || false)

        onClicked: {
            root.taskModel.requestClose(root.modelIndex);
        }
    }
}
