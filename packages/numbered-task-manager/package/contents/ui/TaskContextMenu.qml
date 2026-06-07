// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.extras as PlasmaExtras
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "TaskActionLogic.js" as TaskActionLogic
import "TaskContextMenuLogic.js" as TaskContextMenuLogic
import "TaskEntryLogic.js" as TaskEntryLogic
import "LauncherListLogic.js" as LauncherListLogic

// qmllint disable incompatible-type
PlasmaExtras.Menu {
    id: root

    readonly property var atm: TaskManager.AbstractTasksModel
    readonly property bool hasTask: Boolean(taskModel) && TaskEntryLogic.hasValidModelIndex(modelIndex)
    readonly property var taskRoles: TaskContextMenuLogic.taskRoleSnapshot(roleSource(), roleIds(), task)
    readonly property bool hasWindowTask: hasTask && taskRoles.isWindow
    readonly property var basicActionRoles: TaskContextMenuLogic.basicActionRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var captureCloseRoles: TaskContextMenuLogic.captureCloseRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var desktopEntries: TaskContextMenuLogic.virtualDesktopEntriesSnapshot(virtualDesktopInfo.desktopIds, virtualDesktopInfo.desktopNames)
    readonly property var fullscreenShadeBorderRoles: TaskContextMenuLogic.fullscreenShadeBorderRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var keepAboveBelowRoles: TaskContextMenuLogic.keepAboveBelowRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var minimizeMaximizeRoles: TaskContextMenuLogic.minimizeMaximizeRoleSnapshot(roleSource(), roleIds(), task)
    readonly property var virtualDesktopRoles: TaskContextMenuLogic.virtualDesktopRoleSnapshot(roleSource(), roleIds(), task)
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

    function roleIds() {
        return {
            Activities: atm.Activities,
            CanSetNoBorder: atm.CanSetNoBorder,
            CanLaunchNewInstance: atm.CanLaunchNewInstance,
            HasNoBorder: atm.HasNoBorder,
            IsClosable: atm.IsClosable,
            IsExcludedFromCapture: atm.IsExcludedFromCapture,
            IsFullScreen: atm.IsFullScreen,
            IsFullScreenable: atm.IsFullScreenable,
            IsKeepAbove: atm.IsKeepAbove,
            IsKeepBelow: atm.IsKeepBelow,
            IsLauncher: atm.IsLauncher,
            IsMaximizable: atm.IsMaximizable,
            IsMaximized: atm.IsMaximized,
            IsMinimizable: atm.IsMinimizable,
            IsMinimized: atm.IsMinimized,
            IsMovable: atm.IsMovable,
            IsOnAllVirtualDesktops: atm.IsOnAllVirtualDesktops,
            IsResizable: atm.IsResizable,
            IsShadeable: atm.IsShadeable,
            IsShaded: atm.IsShaded,
            IsVirtualDesktopsChangeable: atm.IsVirtualDesktopsChangeable,
            IsWindow: atm.IsWindow,
            LauncherUrl: atm.LauncherUrl,
            LauncherUrlWithoutIcon: atm.LauncherUrlWithoutIcon,
            VirtualDesktops: atm.VirtualDesktops
        };
    }

    function roleSource() {
        return {
            hasTask: hasTask,
            modelIndex: modelIndex,
            taskModel: taskModel
        };
    }

    function launcherPinState() {
        const url = taskRoles.launcherUrl;
        return LauncherListLogic.launcherPinState(launcherModel ? launcherModel.launcherList : [], url, activityInfo.currentActivity, launcherModel ? pinnedUrl => launcherModel.launcherPosition(pinnedUrl) : -1);
    }

    function refreshActivities() {
        activityEntries = TaskContextMenuLogic.activityEntriesSnapshot(activityInfo.runningActivities(), id => activityInfo.activityName(id), id => activityInfo.activityIcon(id));
    }

    function refreshLauncherActivities() {
        const url = taskRoles.launcherUrl;
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

        requestTaskModelCommand(TaskContextMenuLogic.taskActivityToggleCommand(taskRoles.activities, activityId));
    }

    function launcherPosition() {
        const url = taskRoles.launcherUrl;
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
        const url = taskRoles.launcherUrl;
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
        const url = taskRoles.launcherUrl;
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
            root.requestTaskModelCommand(TaskContextMenuLogic.newInstanceCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.windowCapabilityActionState({
            capable: root.basicActionRoles.isMovable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: "Move"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.moveCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.windowCapabilityActionState({
            capable: root.basicActionRoles.isResizable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: "Resize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.resizeCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.minimizeMaximizeRoles.isMinimizable,
            checked: root.minimizeMaximizeRoles.isMinimized,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Minimize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.minimizeCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.minimizeMaximizeRoles.isMaximizable,
            checked: root.minimizeMaximizeRoles.isMaximized,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Maximize"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.maximizeCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: root.keepAboveBelowRoles.isKeepAbove,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Keep Above Others"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.keepAboveCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: root.keepAboveBelowRoles.isKeepBelow,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: "Keep Below Others"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskContextMenuLogic.keepBelowCommand());
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.fullscreenShadeBorderRoles.fullScreenable,
            checked: root.fullscreenShadeBorderRoles.isFullScreen,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
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
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.fullscreenShadeBorderRoles.isShadeable,
            checked: root.fullscreenShadeBorderRoles.isShaded,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
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
        readonly property var actionState: TaskContextMenuLogic.checkableWindowCapabilityActionState({
            capable: root.fullscreenShadeBorderRoles.canSetNoBorder,
            checked: root.fullscreenShadeBorderRoles.hasNoBorder,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
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
        readonly property var actionState: TaskContextMenuLogic.checkableWindowActionState({
            checked: root.captureCloseRoles.isExcludedFromCapture,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
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
            changeable: root.virtualDesktopRoles.isVirtualDesktopsChangeable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: "Virtual Desktops"
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                readonly property var desktopState: TaskContextMenuLogic.virtualDesktopMenuState(root.taskRoles.virtualDesktops, root.virtualDesktopRoles.isOnAllVirtualDesktops, "")

                checkable: true
                checked: desktopState.allDesktopsChecked
                text: "All Desktops"

                onClicked: {
                    root.requestTaskModelCommand(TaskContextMenuLogic.allVirtualDesktopsCommand());
                }
            }

            readonly property QtQuick.Instantiator _desktopItems: QtQuick.Instantiator {
                active: virtualDesktopsItem.visible
                model: root.desktopEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    readonly property var desktopState: TaskContextMenuLogic.virtualDesktopMenuState(root.taskRoles.virtualDesktops, root.virtualDesktopRoles.isOnAllVirtualDesktops, modelData.id)

                    checkable: true
                    checked: desktopState.desktopChecked
                    text: modelData.name

                    onClicked: {
                        root.requestTaskModelCommand(TaskContextMenuLogic.virtualDesktopCommand(modelData.id));
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
                    root.requestTaskModelCommand(TaskContextMenuLogic.newVirtualDesktopCommand());
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: activitiesItem
        readonly property var actionState: TaskContextMenuLogic.taskActivitiesActionState({
            activityEntryCount: root.activityEntries.length,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
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
                checked: TaskContextMenuLogic.taskActivityMenuState(root.taskRoles.activities, "").allActivitiesChecked
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
                    checked: TaskContextMenuLogic.taskActivityMenuState(root.taskRoles.activities, modelData.id).activityChecked
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
            closable: root.captureCloseRoles.closable,
            hasTask: root.hasTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: "Close"
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(TaskActionLogic.contextMenuTaskCommand("requestClose"));
        }
    }
}
