// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.extras as PlasmaExtras
import org.kde.plasma.plasmoid
import "TaskActionLogic.js" as TaskActionLogic
import "TaskContextMenuLogic.js" as TaskContextMenuLogic

// qmllint disable incompatible-type
PlasmaExtras.Menu {
    id: root

    readonly property bool hasTask: roleState.hasTask
    readonly property var roleSnapshots: roleState.snapshots
    readonly property var taskRoles: roleSnapshots.taskRoles
    readonly property bool hasWindowTask: roleState.hasWindowTask
    readonly property var basicActionRoles: roleSnapshots.basicActionRoles
    readonly property var captureCloseRoles: roleSnapshots.captureCloseRoles
    readonly property var activityEntries: platformState.activityEntries
    readonly property var desktopEntries: platformState.desktopEntries
    readonly property var fullscreenShadeBorderRoles: roleSnapshots.fullscreenShadeBorderRoles
    readonly property var keepAboveBelowRoles: roleSnapshots.keepAboveBelowRoles
    readonly property var minimizeMaximizeRoles: roleSnapshots.minimizeMaximizeRoles
    readonly property var virtualDesktopRoles: roleSnapshots.virtualDesktopRoles
    readonly property var actionSections: TaskContextMenuLogic.contextMenuActionSections({
        activityEntryCount: activityEntries.length,
        basicActionRoles: basicActionRoles,
        captureCloseRoles: captureCloseRoles,
        currentActivity: platformState.currentActivity,
        fullscreenShadeBorderRoles: fullscreenShadeBorderRoles,
        hasTask: hasTask,
        hasTaskModel: taskModel,
        hasWindowTask: hasWindowTask,
        isWindow: taskRoles.isWindow,
        keepAboveBelowRoles: keepAboveBelowRoles,
        launcherActivities: launcherActivityList,
        launcherList: launcherModel ? launcherModel.launcherList : [],
        launcherPosition: launcherPosition(),
        minimizeMaximizeRoles: minimizeMaximizeRoles,
        pinState: launcherPinState(),
        taskRoles: taskRoles,
        virtualDesktopRoles: virtualDesktopRoles
    })
    readonly property var basicActionsSection: actionSections.basicActions
    readonly property var captureActionsSection: actionSections.captureActions
    readonly property var closeActionsSection: actionSections.closeActions
    readonly property var fullscreenShadeBorderActionsSection: actionSections.fullscreenShadeBorderActions
    readonly property var keepAboveBelowActionsSection: actionSections.keepAboveBelowActions
    readonly property var launcherActivityActionsSection: actionSections.launcherActivityActions
    readonly property var minimizeMaximizeActionsSection: actionSections.minimizeMaximizeActions
    readonly property var pinActionsSection: actionSections.pinActions
    readonly property var taskActivityActionsSection: actionSections.taskActivityActions
    readonly property var virtualDesktopActionsSection: actionSections.virtualDesktopActions
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
        platformState.refreshActivities();
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

    function launcherPinState() {
        const url = taskRoles.launcherUrl;
        return TaskContextMenuLogic.launcherPinStateSnapshot(launcherModel ? launcherModel.launcherList : [], url, platformState.currentActivity, launcherModel ? pinnedUrl => launcherModel.launcherPosition(pinnedUrl) : -1);
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

    onStatusChanged: {
        if (status === PlasmaExtras.Menu.Closed) {
            closed();
            destroy();
        }
    }

    readonly property TaskContextMenuPlatformState _platformState: TaskContextMenuPlatformState {
        id: platformState
    }

    readonly property TaskContextMenuRoleState _roleState: TaskContextMenuRoleState {
        id: roleState

        modelIndex: root.modelIndex
        task: root.task
        taskModel: root.taskModel
    }

    PlasmaExtras.MenuItem {
        readonly property var pinAction: root.pinActionsSection.pinLauncher

        enabled: pinAction.enabled
        text: pinAction.text

        onClicked: {
            root.launcherCommandRequested(pinAction.command);
        }
    }

    PlasmaExtras.MenuItem {
        id: launcherActivitiesItem

        readonly property var actionState: root.launcherActivityActionsSection.launcherActivities

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _launcherActivitiesMenu: PlasmaExtras.Menu {
            id: launcherActivitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: launcherActivitiesItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.launcherActivityActionsSection.allLauncherActivities

                checkable: true
                checked: actionState.checked
                text: actionState.text

                onClicked: {
                    const url = root.taskRoles.launcherUrl;
                    if (!root.launcherModel || !url) {
                        return;
                    }

                    root.applyLauncherActivityUpdate(actionState.update);
                    root.refreshLauncherActivities();
                }
            }

            readonly property QtQuick.Instantiator _activityItems: QtQuick.Instantiator {
                active: launcherActivitiesItem.visible
                model: root.activityEntries

                delegate: PlasmaExtras.MenuItem {
                    required property var modelData

                    readonly property var actionState: root.launcherActivityActionsSection.activityAction(modelData)

                    checkable: true
                    checked: actionState.checked
                    text: actionState.text

                    onClicked: {
                        const url = root.taskRoles.launcherUrl;
                        if (!root.launcherModel || !url) {
                            return;
                        }

                        root.applyLauncherActivityUpdate(actionState.update);
                        root.refreshLauncherActivities();
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
        readonly property var sectionState: root.basicActionsSection.separator

        separator: true
        visible: sectionState.visible
    }

    PlasmaExtras.MenuItem {
        id: newInstanceItem

        readonly property var actionState: root.basicActionsSection.newInstance

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.basicActionsSection.move

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.basicActionsSection.resize

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var actionState: root.minimizeMaximizeActionsSection.minimize

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
        readonly property var actionState: root.minimizeMaximizeActionsSection.maximize

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
        readonly property var actionState: root.keepAboveBelowActionsSection.keepAbove

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
        readonly property var actionState: root.keepAboveBelowActionsSection.keepBelow

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
        readonly property var actionState: root.fullscreenShadeBorderActionsSection.fullscreen

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
        readonly property var actionState: root.fullscreenShadeBorderActionsSection.shade

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
        readonly property var actionState: root.fullscreenShadeBorderActionsSection.noBorder

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
        readonly property var actionState: root.captureActionsSection.excludeFromCapture

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
        readonly property var actionState: root.virtualDesktopActionsSection.virtualDesktops

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _virtualDesktopsMenu: PlasmaExtras.Menu {
            id: virtualDesktopsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: virtualDesktopsItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.virtualDesktopActionsSection.allVirtualDesktops

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

                    readonly property var actionState: root.virtualDesktopActionsSection.desktopAction(modelData)

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
                readonly property var actionState: root.virtualDesktopActionsSection.newVirtualDesktop

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
        readonly property var actionState: root.taskActivityActionsSection.taskActivities

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _activitiesMenu: PlasmaExtras.Menu {
            id: activitiesMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: activitiesItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.taskActivityActionsSection.allTaskActivities

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

                    readonly property var actionState: root.taskActivityActionsSection.activityAction(modelData)

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
        readonly property var sectionState: root.closeActionsSection.separator

        separator: true
        visible: sectionState.visible
    }

    PlasmaExtras.MenuItem {
        id: closeItem
        readonly property var actionState: root.closeActionsSection.close

        enabled: actionState.enabled
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            root.requestTaskModelCommand(actionState.command);
        }
    }
}
