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
    readonly property bool hasWindowTask: hasTask && roleSnapshot().isWindow
    readonly property var basicActionRoles: TaskContextMenuLogic.basicActionRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var desktopEntries: TaskContextMenuLogic.virtualDesktopEntriesSnapshot(virtualDesktopInfo.desktopIds, virtualDesktopInfo.desktopNames)
    property var activityEntries: []
    property var launcherModel: taskModel
    property var launcherActivityList: []
    property var modelIndex
    property var task: ({})
    property var taskModel
    property int visualParentWidth: 0

    minimumWidth: visualParentWidth
    placement: TaskContextMenuLogic.panelMenuPlacement(Plasmoid.location, PlasmaCore.Types, PlasmaExtras.Menu)

    signal launcherCommandRequested(var command)
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

        try {
            if (result.requestArguments.length === 0) {
                taskModel[result.requestMethod](modelIndex);
            } else {
                taskModel[result.requestMethod](modelIndex, result.requestArguments[0]);
            }
        } catch (error) {
            const executionResult = TaskActionLogic.contextMenuTaskExecutionResult(result, error);
            logActionResult(executionResult);
            return executionResult;
        }

        return TaskActionLogic.contextMenuTaskExecutionResult(result);
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
            CanLaunchNewInstance: atm.CanLaunchNewInstance,
            IsLauncher: atm.IsLauncher,
            IsMovable: atm.IsMovable,
            IsResizable: atm.IsResizable,
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

    function launcherPinState() {
        const url = roleSnapshot().launcherUrl;
        return LauncherListLogic.launcherPinState(launcherModel ? launcherModel.launcherList : [], url, activityInfo.currentActivity, launcherModel ? pinnedUrl => launcherModel.launcherPosition(pinnedUrl) : -1);
    }

    function refreshActivities() {
        activityEntries = TaskContextMenuLogic.activityEntriesSnapshot(activityInfo.runningActivities(), id => activityInfo.activityName(id), id => activityInfo.activityIcon(id));
    }

    function refreshLauncherActivities() {
        const url = roleSnapshot().launcherUrl;
        if (!launcherModel || !url) {
            launcherActivityList = [];
            return;
        }

        launcherActivityList = TaskContextMenuLogic.launcherActivityListSnapshot(launcherModel.launcherActivities(url));
    }

    function toggleTaskActivity(activityId) {
        if (!hasWindowTask) {
            return;
        }

        requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestActivities", TaskActivityLogic.taskActivitiesAfterToggle(roleSnapshot().activities, activityId)));
    }

    function launcherPosition() {
        const url = roleSnapshot().launcherUrl;
        if (!launcherModel || !url) {
            return -1;
        }

        return launcherModel.launcherPosition(url);
    }

    function applyLauncherActivities(activities) {
        const position = launcherPosition();
        const update = LauncherListLogic.launcherActivityUpdate(launcherModel.launcherList, position, activities);
        if (!update.ok) {
            return false;
        }

        launcherActivityList = update.activities;
        if (!update.changed) {
            return false;
        }

        root.launcherCommandRequested(TaskActionLogic.contextMenuLauncherCommand("replaceLauncherList", update.launchers));
        return true;
    }

    function setLauncherAllActivities() {
        const url = roleSnapshot().launcherUrl;
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
        const url = roleSnapshot().launcherUrl;
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
                root.launcherCommandRequested(TaskActionLogic.contextMenuLauncherCommand("unpinLauncher", url));
            } else {
                root.launcherCommandRequested(TaskActionLogic.contextMenuLauncherCommand("pinLauncher", url));
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
                checked: TaskContextMenuLogic.launcherActivityMenuState(root.launcherActivityList, "").allActivitiesChecked
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
                    checked: TaskContextMenuLogic.launcherActivityMenuState(root.launcherActivityList, modelData.id).activityChecked
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
        visible: TaskContextMenuLogic.menuActionSectionVisible({
            hasWindowTask: root.hasWindowTask,
            launcherActivitiesVisible: launcherActivitiesItem.visible,
            newInstanceVisible: newInstanceItem.visible
        })
    }

    PlasmaExtras.MenuItem {
        id: newInstanceItem

        readonly property var actionState: TaskContextMenuLogic.newInstanceActionState({
            canLaunchNewInstance: root.basicActionRoles.canLaunchNewInstance,
            hasTask: root.hasTask,
            isLauncher: root.basicActionRoles.isLauncher
        })

        enabled: actionState.enabled
        text: "New Instance"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestNewInstance"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.windowCapabilityActionState({
            capable: root.basicActionRoles.isMovable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

        enabled: actionState.enabled
        text: "Move"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestMove"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.windowCapabilityActionState({
            capable: root.basicActionRoles.isResizable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

        enabled: actionState.enabled
        text: "Resize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestResize"));
        }
    }

    PlasmaExtras.MenuItem {
        readonly property bool roleChecked: root.boolRole(root.atm.IsMinimized, root.task.isMinimized || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.boolRole(root.atm.IsMinimizable, root.task.isMinimizable || false),
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsMaximized, root.task.isMaximized || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.boolRole(root.atm.IsMaximizable, root.task.isMaximizable || false),
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsKeepAbove, root.task.isKeepAbove || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsKeepBelow, root.task.isKeepBelow || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsFullScreen, root.task.isFullScreen || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.boolRole(root.atm.IsFullScreenable, root.task.fullScreenable || false),
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsShaded, root.task.isShaded || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.boolRole(root.atm.IsShadeable, root.task.isShadeable || false),
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.HasNoBorder, root.task.hasNoBorder || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.boolRole(root.atm.CanSetNoBorder, root.task.canSetNoBorder || false),
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property bool roleChecked: root.boolRole(root.atm.IsExcludedFromCapture, root.task.isExcludedFromCapture || false)
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: roleChecked,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

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
        readonly property var actionState: TaskContextMenuLogic.virtualDesktopsActionState({
            changeable: root.boolRole(root.atm.IsVirtualDesktopsChangeable, root.task.isVirtualDesktopsChangeable || false),
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

        enabled: actionState.enabled
        text: "Virtual Desktops"
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                readonly property var desktopState: TaskContextMenuLogic.virtualDesktopMenuState(root.roleSnapshot().virtualDesktops, root.boolRole(root.atm.IsOnAllVirtualDesktops, root.task.isOnAllVirtualDesktops || false), "")

                checkable: true
                checked: desktopState.allDesktopsChecked
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

                    readonly property var desktopState: TaskContextMenuLogic.virtualDesktopMenuState(root.roleSnapshot().virtualDesktops, root.boolRole(root.atm.IsOnAllVirtualDesktops, root.task.isOnAllVirtualDesktops || false), modelData.id)

                    checkable: true
                    checked: desktopState.desktopChecked
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
                readonly property var actionState: TaskContextMenuLogic.newVirtualDesktopActionState({
                    hasWindowTask: root.hasWindowTask
                })

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
        readonly property var actionState: TaskContextMenuLogic.taskActivitiesActionState({
            activityEntryCount: root.activityEntries.length,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.roleSnapshot().isWindow
        })

        enabled: actionState.enabled
        text: "Activities"
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _activitiesMenu: PlasmaExtras.Menu {
            id: activitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: activitiesItem.action

            PlasmaExtras.MenuItem {
                checkable: true
                checked: TaskContextMenuLogic.taskActivityMenuState(root.roleSnapshot().activities, "").allActivitiesChecked
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
                    checked: TaskContextMenuLogic.taskActivityMenuState(root.roleSnapshot().activities, modelData.id).activityChecked
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
        readonly property var actionState: TaskContextMenuLogic.closeActionState({
            closable: root.boolRole(root.atm.IsClosable, root.task.closable || false),
            hasTask: root.hasTask,
            isWindow: root.roleSnapshot().isWindow
        })

        enabled: actionState.enabled
        text: "Close"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestClose"));
        }
    }
}
