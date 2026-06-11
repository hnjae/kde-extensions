// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick.Layouts as QtQuickLayouts
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "TaskScopeLogic.mjs" as TaskScopeLogic
import "VisibleTaskItemsLogic.mjs" as VisibleTaskItemsLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    readonly property bool vertical: Plasmoid.formFactor === PlasmaCore.Types.Vertical
    readonly property var normalTaskEntries: normalTaskStore.entries
    readonly property var visibleTaskItems: VisibleTaskItemsLogic.composeVisibleTaskItems(normalTaskEntries, remoteAttentionSource.snapshot)
    readonly property var normalVisibleTaskItems: VisibleTaskItemsLogic.normalVisibleTaskItems(root.visibleTaskItems)

    Plasmoid.icon: "preferences-system-windows"
    Plasmoid.constraintHints: Plasmoid.CanFillArea
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    QtQuickLayouts.Layout.fillWidth: true
    QtQuickLayouts.Layout.fillHeight: true

    function activateTaskAtIndex(index) {
        taskActivation.activateTaskAtIndex(index);
    }

    TaskPlatformState {
        id: taskPlatformState

        taskModel: tasksModel
    }

    TaskActionResultLogger {
        id: actionLogger
    }

    LauncherSyncAdapter {
        id: launcherSync

        configuration: Plasmoid.configuration
        taskModel: tasksModel
    }

    TaskActivationAdapter {
        id: taskActivation

        remoteAttentionSource: remoteAttentionSource
        taskModel: tasksModel
        visibleTaskItems: root.visibleTaskItems

        onActionResult: result => {
            actionLogger.logActionResult(result);
        }
    }

    LauncherCommandAdapter {
        id: launcherCommands

        launcherSync: launcherSync
        taskModel: tasksModel

        onActionResult: result => {
            actionLogger.logActionResult(result);
        }
    }

    TaskContextMenuAdapter {
        id: contextMenuAdapter

        launcherModel: tasksModel
        taskModel: tasksModel

        onActionResult: result => {
            actionLogger.logActionResult(result);
        }

        onLauncherCommandRequested: command => {
            launcherCommands.dispatchLauncherCommand(command);
        }
    }

    NormalTaskStoreAdapter {
        id: normalTaskStore

        visibleLauncherPosition: launcherUrl => taskPlatformState.visibleLauncherPosition(launcherUrl)
    }

    TaskMoveAdapter {
        id: taskMover

        launcherSync: launcherSync
        normalEntries: root.normalTaskEntries
        normalTaskStore: normalTaskStore
        taskModel: tasksModel

        onActionResult: result => {
            actionLogger.logActionResult(result);
        }
    }

    TaskManager.TasksModel {
        id: tasksModel

        activity: taskPlatformState.currentActivity
        filterByActivity: TaskScopeLogic.normalTaskModelFilterSettings().filterByActivity
        filterByScreen: TaskScopeLogic.normalTaskModelFilterSettings().filterByScreen
        filterByVirtualDesktop: TaskScopeLogic.normalTaskModelFilterSettings().filterByVirtualDesktop
        groupMode: TaskManager.TasksModel.GroupDisabled
        hideActivatedLaunchers: false
        launchInPlace: true
        launcherList: Plasmoid.configuration.launchers || []
        separateLaunchers: true
        sortMode: TaskManager.TasksModel.SortManual
        taskReorderingEnabled: true
        virtualDesktop: taskPlatformState.currentDesktop

        onLauncherListChanged: {
            taskPlatformState.noteLauncherListChanged();
            if (!launcherSync.updatingLauncherConfig) {
                if (launcherSync.reconcileLauncherListChange(launcherList)) {
                    return;
                }
                launcherSync.persistLaunchers(tasksModel.launcherList);
            }
        }
    }

    NormalTaskSource {
        taskModel: tasksModel
        currentActivity: taskPlatformState.currentActivity
        currentDesktop: taskPlatformState.currentDesktop
        launcherRevision: taskPlatformState.launcherRevision
        createPublicationKey: () => normalTaskStore.allocatePublicationKey()
        isInCurrentActivity: activities => taskPlatformState.isInCurrentActivity(activities)
        visibleLauncherPosition: (launcherUrl, launcherRevisionToken) => taskPlatformState.visibleLauncherPosition(launcherUrl, launcherRevisionToken)

        onTaskPublished: (key, qualifies, task) => {
            normalTaskStore.publishNormalTask(key, qualifies, task);
        }
        onTaskRemoved: key => {
            normalTaskStore.removeNormalTask(key);
        }
        onActionResult: result => {
            actionLogger.logActionResult(result);
        }
    }

    RemoteAttentionSource {
        id: remoteAttentionSource

        currentActivity: taskPlatformState.currentActivity
        currentDesktop: taskPlatformState.currentDesktop
        isInCurrentActivity: activities => taskPlatformState.isInCurrentActivity(activities)
        visibleTaskItems: root.visibleTaskItems

        onActivationRequested: visibleItem => {
            taskActivation.activateRemoteAttention(visibleItem);
        }

        onContextMenuRequested: request => {
            contextMenuAdapter.openTaskContextMenu(request);
        }

        onActionResult: result => {
            actionLogger.logActionResult(result);
        }
    }

    fullRepresentation: TaskListRepresentation {
        activationAdapter: taskActivation
        contextMenuAdapter: contextMenuAdapter
        moveAdapter: taskMover
        normalVisibleTaskItems: root.normalVisibleTaskItems
        remoteAttentionSource: remoteAttentionSource
        taskDragMimeType: root.taskDragMimeType
        vertical: root.vertical
        visibleTaskItems: root.visibleTaskItems
    }
}
