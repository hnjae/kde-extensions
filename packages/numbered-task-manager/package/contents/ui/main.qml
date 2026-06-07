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
import "TaskModelLogic.js" as TaskModelLogic
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
    readonly property var remoteAttentionVisibleItem: VisibleTaskItemsLogic.visibleRemoteAttentionItem(root.visibleTaskItems)
    property int launcherRevision: 0

    Plasmoid.icon: "preferences-system-windows"
    Plasmoid.constraintHints: Plasmoid.CanFillArea
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    QtQuickLayouts.Layout.fillWidth: true
    QtQuickLayouts.Layout.fillHeight: true

    function activateTaskAtIndex(index) {
        const result = TaskActionLogic.shortcutActivationRequest(visibleTaskItems, index);
        if (!result.ok) {
            logActionResult(result);
            return;
        }

        taskActivation.requestActivation(result);
    }

    function activateTaskEntry(task) {
        const result = TaskActionLogic.taskActivationRequest("activateTask", task, {
            requireSourceIndex: true,
            sourceModel: "normal"
        });
        if (!result.ok) {
            logActionResult(result);
            return;
        }

        taskActivation.requestActivation(result);
    }

    function logActionResult(result) {
        if (!TaskActionLogic.shouldLogActionResult(result)) {
            return;
        }

        console.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }

    function moveTask(sourceIndex, targetIndex) {
        const moveDecision = canMoveTaskResult(sourceIndex, targetIndex);
        if (!moveDecision.canMove) {
            const rejection = TaskActionLogic.dragMoveRejectionResult(moveDecision, sourceIndex, targetIndex);
            logActionResult(rejection);
            return false;
        }

        const sourceEntry = normalTaskEntryForSourceIndex(sourceIndex);
        const targetEntry = normalTaskEntryForSourceIndex(targetIndex);
        if (!sourceEntry || !targetEntry) {
            return false;
        }

        if (!sourceEntry.launcherBacked) {
            return normalTaskStore.moveManualTask(sourceEntry.entryKey, targetEntry.entryKey);
        }

        return movePinnedLauncher(sourceEntry, targetEntry);
    }

    function movePinnedLauncher(sourceEntry, targetEntry) {
        const result = LauncherListLogic.movePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
        if (!result.moved) {
            return false;
        }

        return launcherSync.applyLauncherList(result.launchers);
    }

    function canMovePinnedLauncher(sourceEntry, targetEntry) {
        return LauncherListLogic.canMovePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
    }

    function canMoveTaskResult(sourceIndex, targetIndex) {
        return TaskModelLogic.canMoveTaskResult(normalTaskEntries, sourceIndex, targetIndex, (sourceEntry, targetEntry) => canMovePinnedLauncher(sourceEntry, targetEntry));
    }

    function canMoveTask(sourceIndex, targetIndex) {
        return canMoveTaskResult(sourceIndex, targetIndex).canMove;
    }

    function normalTaskEntryForSourceIndex(sourceIndex) {
        return TaskModelLogic.normalTaskEntryForSourceIndex(normalTaskEntries, sourceIndex);
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

    function activateRemoteAttention() {
        const visibleItem = remoteAttentionVisibleItem;
        const result = TaskActionLogic.taskActivationRequest("activateRemoteAttention", visibleItem ? visibleItem.entry : null, {
            requireSourceIndex: false,
            sourceModel: visibleItem ? visibleItem.sourceModel : "remoteAttention",
            targetKind: visibleItem ? visibleItem.kind : "remoteAttention"
        });
        if (!result.ok) {
            logActionResult(result);
            return;
        }

        taskActivation.requestActivation(result);
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
                    canDropTask: (sourceIndex, targetIndex) => root.canMoveTaskResult(sourceIndex, targetIndex).canMove

                    onActivated: {
                        root.activateTaskEntry(entry);
                    }

                    onContextMenuRequested: request => {
                        contextMenuAdapter.openTaskContextMenu(Object.assign({
                            taskModel: tasksModel
                        }, request));
                    }

                    onTaskDropped: (sourceIndex, targetIndex, drop) => {
                        if (root.moveTask(sourceIndex, targetIndex)) {
                            drop.acceptProposedAction();
                        }
                    }

                    taskData: entry
                }
            }

            AttentionItem {
                id: attentionItem

                readonly property var visibleItem: root.remoteAttentionVisibleItem || ({})
                readonly property var entry: visibleItem.entry || ({})

                QtQuickLayouts.Layout.fillHeight: !root.vertical
                QtQuickLayouts.Layout.fillWidth: root.vertical
                QtQuickLayouts.Layout.preferredWidth: root.vertical ? implicitWidth : fullRepresentationItem.taskSlotWidth

                count: visibleItem.count || 0
                iconSource: entry.iconSource || TaskEntryLogic.remoteAttentionIconFallback()
                modelIndex: entry.modelIndex
                slotWidth: root.vertical ? 0 : fullRepresentationItem.taskSlotWidth
                taskData: entry
                title: entry.title || ""
                titleVisibilityThreshold: fullRepresentationItem.titleVisibilityThreshold
                visible: Boolean(root.remoteAttentionVisibleItem)

                onActivated: {
                    root.activateRemoteAttention();
                }

                onContextMenuRequested: request => {
                    contextMenuAdapter.openTaskContextMenu(Object.assign({
                        taskModel: remoteAttentionSource.taskModel
                    }, request));
                }
            }
        }
    }
}
