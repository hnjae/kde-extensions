// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "ActivityScopeLogic.js" as ActivityScopeLogic
import "TaskEntryLogic.js" as TaskEntryLogic
import "LauncherListLogic.js" as LauncherListLogic
import "TaskMetricsLogic.js" as TaskMetricsLogic
import "TaskScopeLogic.js" as TaskScopeLogic
import "TaskActionLogic.js" as TaskActionLogic
import "VisibleTaskItemsLogic.js" as VisibleTaskItemsLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    readonly property bool vertical: Plasmoid.formFactor === PlasmaCore.Types.Vertical
    readonly property var normalTaskEntries: normalTaskStore.entries
    readonly property var visibleTaskItems: VisibleTaskItemsLogic.composeVisibleTaskItems(normalTaskEntries, remoteAttentionSource.snapshot)
    readonly property var normalVisibleTaskItems: VisibleTaskItemsLogic.normalVisibleTaskItems(root.visibleTaskItems)
    property int launcherRevision: 0

    Plasmoid.icon: "preferences-system-windows"
    Plasmoid.constraintHints: Plasmoid.CanFillArea
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    QtQuickLayouts.Layout.fillWidth: true
    QtQuickLayouts.Layout.fillHeight: true

    function activateTaskAtIndex(index) {
        taskActivation.activateTaskAtIndex(index);
    }

    function logActionResult(result) {
        if (!TaskActionLogic.shouldLogActionResult(result)) {
            return;
        }

        console.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }

    function visibleLauncherPosition(launcherUrl, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? launcherRevision : launcherRevisionToken;
        if (!launcherUrl) {
            return -1;
        }

        if (revision < 0) {
            return -1;
        }

        return LauncherListLogic.visibleLauncherPosition(tasksModel.launcherList, launcherUrl, activityInfo.currentActivity, url => tasksModel.launcherPosition(url));
    }

    function isInCurrentActivity(activities) {
        return ActivityScopeLogic.isInCurrentActivity(activities, activityInfo.currentActivity);
    }

    TaskManager.ActivityInfo {
        id: activityInfo

        onCurrentActivityChanged: {
            root.launcherRevision += 1;
        }
    }

    TaskManager.VirtualDesktopInfo {
        id: virtualDesktopInfo
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
            root.logActionResult(result);
        }
    }

    LauncherCommandAdapter {
        id: launcherCommands

        launcherSync: launcherSync
        taskModel: tasksModel

        onActionResult: result => {
            root.logActionResult(result);
        }
    }

    TaskContextMenuAdapter {
        id: contextMenuAdapter

        launcherModel: tasksModel

        onActionResult: result => {
            root.logActionResult(result);
        }

        onLauncherCommandRequested: command => {
            launcherCommands.dispatchLauncherCommand(command);
        }
    }

    NormalTaskStoreAdapter {
        id: normalTaskStore

        visibleLauncherPosition: launcherUrl => root.visibleLauncherPosition(launcherUrl)
    }

    TaskMoveAdapter {
        id: taskMover

        launcherSync: launcherSync
        normalEntries: root.normalTaskEntries
        normalTaskStore: normalTaskStore
        taskModel: tasksModel

        onActionResult: result => {
            root.logActionResult(result);
        }
    }

    TaskManager.TasksModel {
        id: tasksModel

        activity: activityInfo.currentActivity
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
        virtualDesktop: virtualDesktopInfo.currentDesktop

        onLauncherListChanged: {
            root.launcherRevision += 1;
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
        currentActivity: activityInfo.currentActivity
        currentDesktop: virtualDesktopInfo.currentDesktop
        launcherRevision: root.launcherRevision
        createPublicationKey: () => normalTaskStore.allocatePublicationKey()
        isInCurrentActivity: activities => root.isInCurrentActivity(activities)
        visibleLauncherPosition: (launcherUrl, launcherRevisionToken) => root.visibleLauncherPosition(launcherUrl, launcherRevisionToken)

        onTaskPublished: (key, qualifies, task) => {
            normalTaskStore.publishNormalTask(key, qualifies, task);
        }
        onTaskRemoved: key => {
            normalTaskStore.removeNormalTask(key);
        }
    }

    RemoteAttentionSource {
        id: remoteAttentionSource

        currentActivity: activityInfo.currentActivity
        currentDesktop: virtualDesktopInfo.currentDesktop
        isInCurrentActivity: activities => root.isInCurrentActivity(activities)
        visibleTaskItems: root.visibleTaskItems

        onActivationRequested: visibleItem => {
            taskActivation.activateRemoteAttention(visibleItem);
        }

        onContextMenuRequested: request => {
            contextMenuAdapter.openTaskContextMenu(request);
        }
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        readonly property int taskExtent: TaskMetricsLogic.taskExtent()
        readonly property int titleVisibilityThreshold: TaskMetricsLogic.titleVisibilityThreshold()
        readonly property real minimumReadableSlotWidth: TaskMetricsLogic.minimumReadableSlotWidth(taskExtent, Kirigami.Units.smallSpacing)
        readonly property int visibleItemCount: root.visibleTaskItems.length
        readonly property real taskSlotWidth: root.vertical ? taskExtent : TaskMetricsLogic.taskSlotWidth(width, visibleItemCount, minimumReadableSlotWidth, TaskMetricsLogic.maximumSlotWidth())
        readonly property real attentionLongExtent: attentionItem.visible ? (root.vertical ? attentionItem.implicitHeight + taskLayout.rowSpacing : attentionItem.implicitWidth + taskLayout.columnSpacing) : 0

        implicitWidth: root.vertical ? Math.max(titleVisibilityThreshold, Math.max(taskList.contentWidth, attentionItem.visible ? attentionItem.implicitWidth : 0)) : Math.max(160, taskList.contentWidth + attentionLongExtent)
        implicitHeight: root.vertical ? Math.max(taskExtent, taskList.contentHeight + attentionLongExtent) : taskExtent

        QtQuickLayouts.Layout.fillWidth: true
        QtQuickLayouts.Layout.fillHeight: true
        QtQuickLayouts.Layout.minimumWidth: 0
        QtQuickLayouts.Layout.preferredWidth: implicitWidth
        QtQuickLayouts.Layout.minimumHeight: 0
        QtQuickLayouts.Layout.preferredHeight: implicitHeight

        QtQuickLayouts.GridLayout {
            id: taskLayout

            anchors.fill: parent
            columns: root.vertical ? 1 : 2
            rows: root.vertical ? 2 : 1
            columnSpacing: 0
            rowSpacing: 0

            QtQuick.ListView {
                id: taskList

                QtQuickLayouts.Layout.fillHeight: true
                QtQuickLayouts.Layout.fillWidth: true
                QtQuickLayouts.Layout.preferredHeight: root.vertical ? contentHeight : fullRepresentationItem.taskExtent
                QtQuickLayouts.Layout.preferredWidth: root.vertical ? fullRepresentationItem.taskExtent : contentWidth

                boundsBehavior: QtQuick.Flickable.StopAtBounds
                clip: true
                interactive: root.vertical ? contentHeight > height : contentWidth > width
                model: root.normalVisibleTaskItems
                orientation: root.vertical ? QtQuick.ListView.Vertical : QtQuick.ListView.Horizontal
                spacing: 0

                delegate: TaskItem {
                    required property int index
                    required property var modelData

                    readonly property var visibleItem: modelData || ({})
                    readonly property var entry: visibleItem.entry || ({})

                    height: root.vertical ? implicitHeight : taskList.height
                    width: root.vertical ? taskList.width : fullRepresentationItem.taskSlotWidth
                    slotWidth: root.vertical ? 0 : fullRepresentationItem.taskSlotWidth
                    taskIndex: entry.moveIndex ?? entry.sourceIndex ?? -1
                    modelIndex: entry.modelIndex
                    slotNumber: visibleItem.slotNumber || 0
                    title: entry.title || ""
                    showTitle: !(entry.launcherBacked && entry.isLauncher)
                    titleVisibilityThreshold: fullRepresentationItem.titleVisibilityThreshold
                    iconSource: entry.iconSource || TaskEntryLogic.normalTaskIconFallback()
                    active: entry.active || false
                    minimized: entry.isMinimized || false
                    pinnedLauncherOnly: entry.launcherBacked && entry.isLauncher
                    launcher: entry.isLauncher || false
                    demandingAttention: entry.demandingAttention || false
                    dragMimeType: root.taskDragMimeType
                    canDropTask: (sourceIndex, targetIndex) => taskMover.canMoveTaskResult(sourceIndex, targetIndex).canMove

                    onActivated: {
                        taskActivation.activateTaskEntry(entry);
                    }

                    onContextMenuRequested: request => {
                        contextMenuAdapter.openTaskContextMenu(Object.assign({
                            taskModel: tasksModel
                        }, request));
                    }

                    onTaskDropped: (sourceIndex, targetIndex, drop) => {
                        if (taskMover.moveTask(sourceIndex, targetIndex)) {
                            drop.acceptProposedAction();
                        }
                    }

                    taskData: entry
                }
            }

            RemoteAttentionItem {
                id: attentionItem

                source: remoteAttentionSource
                taskSlotWidth: fullRepresentationItem.taskSlotWidth
                titleVisibilityThreshold: fullRepresentationItem.titleVisibilityThreshold
                vertical: root.vertical
            }
        }
    }
}
