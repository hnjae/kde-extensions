// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.extras as PlasmaExtras
import org.kde.plasma.plasmoid
import io.github.hnjae.numberedtaskmanager as NumberedTaskManager
import "TaskContextMenuLogic.mjs" as TaskContextMenuLogic

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
    readonly property var launcherActivityList: launcherActivityAdapter.launcherActivityList
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
        launcherList: launcherState.launcherList,
        launcherPosition: launcherState.launcherPosition,
        minimizeMaximizeRoles: minimizeMaximizeRoles,
        pinState: launcherState.pinState,
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
    readonly property var moreActionsSection: actionSections.moreActions
    readonly property var pinActionsSection: actionSections.pinActions
    readonly property var taskActivityActionsSection: actionSections.taskActivityActions
    readonly property var virtualDesktopActionsSection: actionSections.virtualDesktopActions
    readonly property var desktopActions: contextMenuBackend.desktopActions(root.taskRoles.launcherUrl || "", root)
    property var launcherModel: taskModel
    property var modelIndex
    property var task: ({})
    property var taskModel
    property var taskCommandPort
    property int visualParentWidth: 0

    minimumWidth: visualParentWidth
    placement: TaskContextMenuLogic.panelMenuPlacement(Plasmoid.location, PlasmaCore.Types, PlasmaExtras.Menu)

    signal actionResult(var result)
    signal launcherCommandRequested(var command)
    signal closed

    function show() {
        platformState.refreshActivities();
        launcherActivityAdapter.refreshLauncherActivities();
        openRelative();
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

    readonly property TaskContextMenuLauncherState _launcherState: TaskContextMenuLauncherState {
        id: launcherState

        currentActivity: platformState.currentActivity
        launcherModel: root.launcherModel
        launcherUrl: root.taskRoles.launcherUrl
    }

    readonly property TaskContextMenuLauncherActivityAdapter _launcherActivityAdapter: TaskContextMenuLauncherActivityAdapter {
        id: launcherActivityAdapter

        launcherModel: root.launcherModel
        launcherUrl: root.taskRoles.launcherUrl

        onLauncherCommandRequested: command => {
            root.launcherCommandRequested(command);
        }
        onActionResult: result => {
            root.actionResult(result);
        }
    }

    readonly property TaskContextMenuTaskCommandAdapter _taskCommandAdapter: TaskContextMenuTaskCommandAdapter {
        id: taskCommandAdapter

        modelIndex: root.modelIndex
        task: root.task
        taskCommandPort: root.taskCommandPort

        onActionResult: result => {
            root.actionResult(result);
        }
    }

    readonly property TaskContextMenuActionDispatcher _actionDispatcher: TaskContextMenuActionDispatcher {
        id: actionDispatcher

        launcherActivityAdapter: launcherActivityAdapter
        taskCommandAdapter: taskCommandAdapter

        onLauncherCommandRequested: command => {
            root.launcherCommandRequested(command);
        }
        onActionResult: result => {
            root.actionResult(result);
        }
    }

    PlasmaExtras.MenuItem {
        id: pinActionItem
        readonly property var pinAction: root.pinActionsSection.pinLauncher

        enabled: pinAction.enabled
        icon: pinAction.icon || ""
        text: pinAction.text

        onClicked: {
            actionDispatcher.triggerAction(pinAction);
        }
    }

    readonly property NumberedTaskManager.TaskContextMenuBackend _contextMenuBackend: NumberedTaskManager.TaskContextMenuBackend {
        id: contextMenuBackend
    }

    readonly property QtQuick.Instantiator _desktopActionItems: QtQuick.Instantiator {
        active: root.desktopActions.length > 0
        model: root.desktopActions

        delegate: PlasmaExtras.MenuItem {
            id: item
            required property var modelData

            action: modelData

            onModelDataChanged: {
                item.action = modelData;
            }
        }

        onObjectAdded: (index, object) => {
            root.addMenuItem(object, pinActionItem);
        }

        onObjectRemoved: (index, object) => {
            root.removeMenuItem(object);
        }
    }

    PlasmaExtras.MenuItem {
        id: launcherActivitiesItem

        readonly property var actionState: root.launcherActivityActionsSection.launcherActivities

        enabled: actionState.enabled
        icon: actionState.icon || ""
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
                    actionDispatcher.triggerAction(actionState);
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
                        actionDispatcher.triggerAction(actionState);
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
        icon: actionState.icon || ""
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            actionDispatcher.triggerAction(actionState);
        }
    }

    PlasmaExtras.MenuItem {
        id: moreActionsItem
        readonly property var actionState: root.moreActionsSection.moreActions

        enabled: actionState.enabled
        icon: actionState.icon || ""
        text: actionState.text
        visible: actionState.visible

        readonly property PlasmaExtras.Menu _moreActionsMenu: PlasmaExtras.Menu {
            id: moreActionsMenu

            placement: PlasmaExtras.Menu.RightPosedTopAlignedPopup
            visualParent: moreActionsItem.action

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.basicActionsSection.move

                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.basicActionsSection.resize

                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.minimizeMaximizeActionsSection.maximize

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.minimizeMaximizeActionsSection.minimize

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.keepAboveBelowActionsSection.keepAbove

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.keepAboveBelowActionsSection.keepBelow

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.fullscreenShadeBorderActionsSection.fullscreen

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.fullscreenShadeBorderActionsSection.shade

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.fullscreenShadeBorderActionsSection.noBorder

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }

            PlasmaExtras.MenuItem {
                readonly property var actionState: root.captureActionsSection.excludeFromCapture

                checkable: true
                checked: actionState.checked
                enabled: actionState.enabled
                icon: actionState.icon || ""
                text: actionState.text
                visible: actionState.visible

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: virtualDesktopsItem
        readonly property var actionState: root.virtualDesktopActionsSection.virtualDesktops

        enabled: actionState.enabled
        icon: actionState.icon || ""
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
                    actionDispatcher.triggerAction(actionState);
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
                        actionDispatcher.triggerAction(actionState);
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
                icon: actionState.icon || ""
                text: actionState.text

                onClicked: {
                    actionDispatcher.triggerAction(actionState);
                }
            }
        }
    }

    PlasmaExtras.MenuItem {
        id: activitiesItem
        readonly property var actionState: root.taskActivityActionsSection.taskActivities

        enabled: actionState.enabled
        icon: actionState.icon || ""
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
                    actionDispatcher.triggerAction(actionState);
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
                        actionDispatcher.triggerAction(actionState);
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
    }

    PlasmaExtras.MenuItem {
        readonly property var configureAction: Plasmoid.internalAction("configure")

        enabled: configureAction && configureAction.enabled
        icon: configureAction ? configureAction.icon : ""
        text: configureAction ? configureAction.text : ""
        visible: configureAction && configureAction.visible

        onClicked: {
            configureAction.trigger();
        }
    }

    PlasmaExtras.MenuItem {
        readonly property var editModeAction: Plasmoid.containment ? Plasmoid.containment.internalAction("configure") : null

        enabled: editModeAction && editModeAction.enabled
        icon: editModeAction ? editModeAction.icon : ""
        text: editModeAction ? editModeAction.text : ""
        visible: editModeAction && editModeAction.visible

        onClicked: {
            editModeAction.trigger();
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
        icon: actionState.icon || ""
        text: actionState.text
        visible: actionState.visible

        onClicked: {
            actionDispatcher.triggerAction(actionState);
        }
    }
}
