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
        return TaskContextMenuLogic.launcherPinStateSnapshot(launcherModel ? launcherModel.launcherList : [], url, activityInfo.currentActivity, launcherModel ? pinnedUrl => launcherModel.launcherPosition(pinnedUrl) : -1);
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

    function launcherPosition() {
        const url = taskRoles.launcherUrl;
        if (!launcherModel || !url) {
            return -1;
        }

        return launcherModel.launcherPosition(url);
    }

    function applyLauncherActivityUpdate(update) {
        if (!update.ok) {
            return false;
        }

        launcherActivityList = update.activities;
        if (!update.changed) {
            return false;
        }

        root.launcherCommandRequested(update.command);
        return true;
    }

    function setLauncherAllActivities() {
        const url = taskRoles.launcherUrl;
        if (!launcherModel || !url) {
            return;
        }

        applyLauncherActivityUpdate(TaskContextMenuLogic.launcherAllActivitiesUpdateCommand(launcherModel.launcherList, launcherPosition(), launcherActivityList, activityInfo.currentActivity));
        refreshLauncherActivities();
    }

    function toggleLauncherActivity(activityId) {
        const url = taskRoles.launcherUrl;
        if (!launcherModel || !url) {
            return;
        }

        applyLauncherActivityUpdate(TaskContextMenuLogic.launcherActivityToggleUpdateCommand(launcherModel.launcherList, launcherPosition(), launcherActivityList, activityId, activityInfo.currentActivity));
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
        readonly property var pinAction: TaskContextMenuLogic.pinLauncherAction(root.launcherPinState())

        enabled: pinAction.enabled
        text: pinAction.text

        onClicked: {
            root.launcherCommandRequested(pinAction.command);
        }
    }

    PlasmaExtras.MenuItem {
        id: launcherActivitiesItem

        readonly property var pinState: root.launcherPinState()
        readonly property var actionState: TaskContextMenuLogic.launcherActivitiesActionState(pinState, root.activityEntries.length, root.taskModel)

        enabled: actionState.enabled
        text: "Launcher Activities"
        visible: actionState.visible

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

        readonly property var actionState: TaskContextMenuLogic.newInstanceAction({
            canLaunchNewInstance: root.basicActionRoles.canLaunchNewInstance,
            hasTask: root.hasTask,
            isLauncher: root.basicActionRoles.isLauncher
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.basicMoveAction({
            capable: root.basicActionRoles.isMovable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.basicResizeAction({
            capable: root.basicActionRoles.isResizable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.minimizeAction({
            capable: root.minimizeMaximizeRoles.isMinimizable,
            checked: root.minimizeMaximizeRoles.isMinimized,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.maximizeAction({
            capable: root.minimizeMaximizeRoles.isMaximizable,
            checked: root.minimizeMaximizeRoles.isMaximized,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.keepAboveAction({
            checked: root.keepAboveBelowRoles.isKeepAbove,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.keepBelowAction({
            checked: root.keepAboveBelowRoles.isKeepBelow,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.fullscreenAction({
            capable: root.fullscreenShadeBorderRoles.fullScreenable,
            checked: root.fullscreenShadeBorderRoles.isFullScreen,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.shadeAction({
            capable: root.fullscreenShadeBorderRoles.isShadeable,
            checked: root.fullscreenShadeBorderRoles.isShaded,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.noBorderAction({
            capable: root.fullscreenShadeBorderRoles.canSetNoBorder,
            checked: root.fullscreenShadeBorderRoles.hasNoBorder,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: TaskContextMenuLogic.excludeFromCaptureAction({
            checked: root.captureCloseRoles.isExcludedFromCapture,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        checkable: true
        checked: actionState.checked
        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        id: virtualDesktopsItem
        readonly property var actionState: TaskContextMenuLogic.virtualDesktopsAction({
            changeable: root.virtualDesktopRoles.isVirtualDesktopsChangeable,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: TaskContextMenuLogic.allVirtualDesktopsAction(root.taskRoles.virtualDesktops, root.virtualDesktopRoles.isOnAllVirtualDesktops)

                checkable: true
                checked: actionState.checked
                text: actionState.text

                onClicked: {
                    root.requestTaskModelCommand(actionState.command);
                }
            }

            readonly property QtQuick.Instantiator _desktopItems: QtQuick.Instantiator {
                active: virtualDesktopsItem.visible
                model: root.desktopEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    readonly property var actionState: TaskContextMenuLogic.virtualDesktopAction(root.taskRoles.virtualDesktops, root.virtualDesktopRoles.isOnAllVirtualDesktops, modelData)

                    checkable: true
                    checked: actionState.checked
                    text: actionState.text

                    onClicked: {
                        root.requestTaskModelCommand(actionState.command);
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
                readonly property var actionState: TaskContextMenuLogic.newVirtualDesktopAction({
                    hasWindowTask: root.hasWindowTask
                })

                enabled: actionState.enabled
                text: actionState.text

                onClicked: {
                    root.requestTaskModelCommand(actionState.command);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: activitiesItem
        readonly property var actionState: TaskContextMenuLogic.taskActivitiesAction({
            activityEntryCount: root.activityEntries.length,
            hasWindowTask: root.hasWindowTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _activitiesMenu: PlasmaExtras.Menu {
            id: activitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: activitiesItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: TaskContextMenuLogic.allTaskActivitiesAction(root.taskRoles.activities)

                checkable: true
                checked: actionState.checked
                text: actionState.text

                onClicked: {
                    root.requestTaskModelCommand(actionState.command);
                }
            }

            readonly property QtQuick.Instantiator _activityItems: QtQuick.Instantiator {
                active: activitiesItem.visible
                model: root.activityEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    readonly property var actionState: TaskContextMenuLogic.taskActivityAction(root.taskRoles.activities, modelData)

                    checkable: true
                    checked: actionState.checked
                    text: actionState.text

                    onClicked: {
                        root.requestTaskModelCommand(actionState.command);
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
        readonly property var actionState: TaskContextMenuLogic.closeAction({
            closable: root.captureCloseRoles.closable,
            hasTask: root.hasTask,
            isWindow: root.taskRoles.isWindow
        })

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }
}
