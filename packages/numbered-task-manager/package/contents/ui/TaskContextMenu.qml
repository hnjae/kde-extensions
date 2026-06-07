// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.extras as PlasmaExtras
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "TaskActivityLogic.js" as TaskActivityLogic
import "TaskActionLogic.js" as TaskActionLogic
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
    signal closed

    function show() {
        refreshActivities();
        refreshLauncherActivities();
        openRelative();
    }

    function logActionResult(result) {
        if (!TaskActionLogic.shouldLogActionResult(result)) {
            return;
        }

        console.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }

    function requestTaskModelCommand(command) {
        const result = TaskActionLogic.contextMenuTaskRequest(command, taskModel, modelIndex, task);
        if (!result.ok) {
            logActionResult(result);
            return result;
        }

        if (result.requestArguments.length === 0) {
            taskModel[result.requestMethod](modelIndex);
        } else {
            taskModel[result.requestMethod](modelIndex, result.requestArguments[0]);
        }
        return result;
    }

    function roleData(role, fallback) {
        return TaskContextMenuLogic.roleData(roleSource(), role, fallback);
    }

    function boolRole(role, fallback) {
        return TaskContextMenuLogic.boolRoleData(roleSource(), role, fallback || false);
    }

    function roleIds() {
        return {
            Activities: atm.Activities,
            IsLauncher: atm.IsLauncher,
            IsWindow: atm.IsWindow,
            LauncherUrl: atm.LauncherUrl,
            LauncherUrlWithoutIcon: atm.LauncherUrlWithoutIcon,
            VirtualDesktops: atm.VirtualDesktops
        };
    }

    function roleSnapshot() {
        return TaskContextMenuLogic.taskRoleSnapshot(roleSource(), roleIds(), task);
    }

    function roleSource() {
        return {
            hasTask: hasTask,
            modelIndex: modelIndex,
            taskModel: taskModel
        };
    }

    function launcherUrl() {
        return roleSnapshot().launcherUrl;
    }

    function launcherPinState() {
        const url = launcherUrl();
        return LauncherListLogic.launcherPinState(launcherModel ? launcherModel.launcherList : [], url, activityInfo.currentActivity, launcherModel ? pinnedUrl => launcherModel.launcherPosition(pinnedUrl) : -1);
    }

    function newInstanceActionState() {
        return TaskContextMenuLogic.newInstanceActionState({
            canLaunchNewInstance: boolRole(atm.CanLaunchNewInstance, task.canLaunchNewInstance || false),
            hasTask: hasTask,
            isLauncher: isLauncher()
        });
    }

    function windowCapabilityActionState(role, fallback) {
        return TaskContextMenuLogic.windowCapabilityActionState({
            capable: boolRole(role, fallback || false),
            hasWindowTask: hasWindowTask,
            isWindow: isWindow()
        });
    }

    function checkableWindowCapabilityActionState(capabilityRole, capabilityFallback, checkedRole, checkedFallback) {
        return TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: boolRole(capabilityRole, capabilityFallback || false),
            checked: boolRole(checkedRole, checkedFallback || false),
            hasWindowTask: hasWindowTask,
            isWindow: isWindow()
        });
    }

    function checkableWindowActionState(checkedRole, checkedFallback) {
        return TaskContextMenuLogic.checkableWindowActionState({
            checked: boolRole(checkedRole, checkedFallback || false),
            hasWindowTask: hasWindowTask,
            isWindow: isWindow()
        });
    }

    function menuActionSectionVisible(launcherActivitiesVisible, newInstanceVisible) {
        return TaskContextMenuLogic.menuActionSectionVisible({
            hasWindowTask: hasWindowTask,
            launcherActivitiesVisible: launcherActivitiesVisible,
            newInstanceVisible: newInstanceVisible
        });
    }

    function virtualDesktopsActionState() {
        return TaskContextMenuLogic.virtualDesktopsActionState({
            changeable: boolRole(atm.IsVirtualDesktopsChangeable, task.isVirtualDesktopsChangeable || false),
            hasWindowTask: hasWindowTask,
            isWindow: isWindow()
        });
    }

    function newVirtualDesktopActionState() {
        return TaskContextMenuLogic.newVirtualDesktopActionState({
            hasWindowTask: hasWindowTask
        });
    }

    function taskActivitiesActionState() {
        return TaskContextMenuLogic.taskActivitiesActionState({
            activityEntryCount: activityEntries.length,
            hasWindowTask: hasWindowTask,
            isWindow: isWindow()
        });
    }

    function closeActionState() {
        return TaskContextMenuLogic.closeActionState({
            closable: boolRole(atm.IsClosable, task.closable || false),
            hasTask: hasTask,
            isWindow: isWindow()
        });
    }

    function activities() {
        return roleSnapshot().activities;
    }

    function virtualDesktops() {
        return roleSnapshot().virtualDesktops;
    }

    function isWindow() {
        return roleSnapshot().isWindow;
    }

    function isLauncher() {
        return roleSnapshot().isLauncher;
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

        launcherActivityList = TaskContextMenuLogic.launcherActivityListSnapshot(launcherModel.launcherActivities(url));
    }

    function taskOnAllActivities() {
        return taskActivityMenuState("").allActivitiesChecked;
    }

    function taskOnActivity(activityId) {
        return taskActivityMenuState(activityId).activityChecked;
    }

    function taskActivityMenuState(activityId) {
        return TaskContextMenuLogic.taskActivityMenuState(activities(), activityId);
    }

    function virtualDesktopMenuState(desktop) {
        return TaskContextMenuLogic.virtualDesktopMenuState(virtualDesktops(), boolRole(atm.IsOnAllVirtualDesktops, task.isOnAllVirtualDesktops || false), desktop);
    }

    function toggleTaskActivity(activityId) {
        if (!hasWindowTask) {
            return;
        }

        requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestActivities", TaskActivityLogic.taskActivitiesAfterToggle(activities(), activityId)));
    }

    function launcherPinnedToAllActivities() {
        return launcherActivityMenuState("").allActivitiesChecked;
    }

    function launcherPinnedToActivity(activityId) {
        return launcherActivityMenuState(activityId).activityChecked;
    }

    function launcherActivityMenuState(activityId) {
        return TaskContextMenuLogic.launcherActivityMenuState(launcherActivityList, activityId);
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
            closed();
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
        readonly property var pinAction: TaskContextMenuLogic.pinActionState(root.launcherPinState())

        enabled: pinAction.enabled
        text: pinAction.text

        onClicked: {
            const pinState = root.launcherPinState();
            const action = TaskContextMenuLogic.pinActionState(pinState);
            const url = pinState.launcherUrl;
            if (action.action === "unpin") {
                root.unpinRequested(url);
            } else {
                root.pinRequested(url);
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: launcherActivitiesItem

        readonly property var pinState: root.launcherPinState()

        enabled: Boolean(root.taskModel) && pinState.canPin
        text: "Launcher Activities"
        visible: TaskContextMenuLogic.launcherActivitiesVisible(pinState, root.activityEntries.length)

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
        visible: root.menuActionSectionVisible(launcherActivitiesItem.visible, newInstanceItem.visible)
    }

    PlasmaExtras.MenuItem {
        id: newInstanceItem

        readonly property var actionState: root.newInstanceActionState()

        enabled: actionState.enabled
        text: "New Instance"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestNewInstance"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.windowCapabilityActionState(root.atm.IsMovable, root.task.isMovable || false)

        enabled: actionState.enabled
        text: "Move"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestMove"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.windowCapabilityActionState(root.atm.IsResizable, root.task.isResizable || false)

        enabled: actionState.enabled
        text: "Resize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestResize"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowCapabilityActionState(root.atm.IsMinimizable, root.task.isMinimizable || false, root.atm.IsMinimized, root.task.isMinimized || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Minimize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleMinimized"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowCapabilityActionState(root.atm.IsMaximizable, root.task.isMaximizable || false, root.atm.IsMaximized, root.task.isMaximized || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Maximize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleMaximized"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowActionState(root.atm.IsKeepAbove, root.task.isKeepAbove || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Keep Above Others"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleKeepAbove"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowActionState(root.atm.IsKeepBelow, root.task.isKeepBelow || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Keep Below Others"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleKeepBelow"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowCapabilityActionState(root.atm.IsFullScreenable, root.task.fullScreenable || false, root.atm.IsFullScreen, root.task.isFullScreen || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Fullscreen"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleFullScreen"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowCapabilityActionState(root.atm.IsShadeable, root.task.isShadeable || false, root.atm.IsShaded, root.task.isShaded || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Shade"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleShaded"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowCapabilityActionState(root.atm.CanSetNoBorder, root.task.canSetNoBorder || false, root.atm.HasNoBorder, root.task.hasNoBorder || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "No Border"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleNoBorder"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.checkableWindowActionState(root.atm.IsExcludedFromCapture, root.task.isExcludedFromCapture || false)

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Hide from Screencasts"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestToggleExcludeFromCapture"));
        }
    }

    PlasmaExtras.MenuItem {
        id: virtualDesktopsItem
        readonly property var actionState: root.virtualDesktopsActionState()

        enabled: actionState.enabled
        text: "Virtual Desktops"
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: root.virtualDesktopMenuState("").allDesktopsChecked
                text: "All Desktops"

                onClicked: {
                    root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestVirtualDesktops", []));
                }
            }

            readonly property QtQuick.Instantiator _desktopItems: QtQuick.Instantiator {
                active: virtualDesktopsItem.visible
                model: root.desktopEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    checkable: true
                    checked: root.virtualDesktopMenuState(modelData.id).desktopChecked
                    text: modelData.name

                    onClicked: {
                        root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestVirtualDesktops", [modelData.id]));
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
                readonly property var actionState: root.newVirtualDesktopActionState()

                enabled: actionState.enabled
                text: "New Desktop"

                onClicked: {
                    root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestNewVirtualDesktop"));
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: activitiesItem
        readonly property var actionState: root.taskActivitiesActionState()

        enabled: actionState.enabled
        text: "Activities"
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _activitiesMenu: PlasmaExtras.Menu {
            id: activitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: activitiesItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: root.taskOnAllActivities()
                text: "All Activities"

                onClicked: {
                    root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestActivities", []));
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
        readonly property var actionState: root.closeActionState()

        enabled: actionState.enabled
        text: "Close"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestClose"));
        }
    }
}
