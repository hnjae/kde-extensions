// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.taskmanager as TaskManager
import org.kde.plasma.plasmoid
import "TaskHelpers.js" as TaskHelpers
import "TaskModelLogic.js" as TaskModelLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    property var normalTaskEntries: []
    property var normalTaskEntryMap: ({})
    property var normalTaskManualOrder: []
    property int nextNormalTaskPublicationId: 0
    property int remoteAttentionCount: 0
    property var remoteAttentionEntries: []
    property var remoteAttentionEntryMap: ({})
    property var remoteAttentionOrder: []
    property var remoteAttentionTarget: null
    property int launcherRevision: 0
    property bool updatingLauncherConfig: false

    Plasmoid.icon: "preferences-system-windows"
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    function activateTaskAtIndex(index) {
        if (index === 9 && remoteAttentionTarget) {
            activateRemoteAttention();
            return;
        }

        const taskCount = normalTaskEntries.length;
        if (taskCount <= 0) {
            return;
        }

        const targetIndex = index === 9 ? taskCount - 1 : index;
        if (targetIndex < 0 || targetIndex >= taskCount) {
            return;
        }

        const targetTask = normalTaskEntries[targetIndex];
        if (!targetTask || !TaskModelLogic.hasValidModelIndex(targetTask.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(targetTask.modelIndex);
    }

    function activateTaskEntry(task) {
        if (!task || task.sourceIndex === undefined || task.sourceIndex < 0 || !TaskModelLogic.hasValidModelIndex(task.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(task.modelIndex);
    }

    function normalizedLauncherList(value) {
        return TaskHelpers.normalizedLauncherList(value);
    }

    function launcherListsEqual(left, right) {
        return TaskHelpers.launcherListsEqual(left, right);
    }

    function persistLaunchers(launchers) {
        const normalized = normalizedLauncherList(launchers);
        if (launcherListsEqual(normalized, Plasmoid.configuration.launchers)) {
            return;
        }

        updatingLauncherConfig = true;
        Plasmoid.configuration.launchers = normalized;
        updatingLauncherConfig = false;
    }

    function pinLauncher(launcherUrl) {
        if (!launcherUrl) {
            return;
        }

        if (tasksModel.requestAddLauncher(launcherUrl)) {
            persistLaunchers(tasksModel.launcherList);
        }
    }

    function unpinLauncher(launcherUrl) {
        if (!launcherUrl) {
            return;
        }

        if (tasksModel.requestRemoveLauncher(launcherUrl)) {
            persistLaunchers(tasksModel.launcherList);
        }
    }

    function moveTask(sourceIndex, targetIndex) {
        if (!canMoveTask(sourceIndex, targetIndex)) {
            return false;
        }

        const sourceEntry = normalTaskEntryForSourceIndex(sourceIndex);
        const targetEntry = normalTaskEntryForSourceIndex(targetIndex);
        if (!sourceEntry || !targetEntry) {
            return false;
        }

        if (!sourceEntry.launcherBacked) {
            return moveManualTask(sourceEntry.entryKey, targetEntry.entryKey);
        }

        return movePinnedLauncher(sourceEntry, targetEntry);
    }

    function moveManualTask(sourceKey, targetKey) {
        const result = TaskModelLogic.moveManualTaskOrder(normalTaskEntries, sourceKey, targetKey);
        if (!result.moved) {
            return false;
        }

        normalTaskManualOrder = result.order;
        recomputeNormalTaskEntries();
        return true;
    }

    function movePinnedLauncher(sourceEntry, targetEntry) {
        const result = TaskHelpers.movePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
        if (!result.moved) {
            return false;
        }

        persistLaunchers(result.launchers);
        return true;
    }

    function canMovePinnedLauncher(sourceEntry, targetEntry) {
        return TaskHelpers.canMovePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
    }

    function canMoveTask(sourceIndex, targetIndex) {
        return TaskModelLogic.canMoveTask(normalTaskEntries, sourceIndex, targetIndex, (sourceEntry, targetEntry) => canMovePinnedLauncher(sourceEntry, targetEntry));
    }

    function normalTaskEntryForSourceIndex(sourceIndex) {
        return TaskModelLogic.normalTaskEntryForSourceIndex(normalTaskEntries, sourceIndex);
    }

    function createNormalTaskPublicationKey() {
        nextNormalTaskPublicationId += 1;
        return "normal:" + nextNormalTaskPublicationId.toString();
    }

    function stringListContains(list, value) {
        return TaskHelpers.stringListContains(list, value);
    }

    function visibleLauncherPosition(launcherUrl, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? launcherRevision : launcherRevisionToken;
        if (!launcherUrl) {
            return -1;
        }

        if (revision < 0) {
            return -1;
        }

        return TaskHelpers.visibleLauncherPosition(tasksModel.launcherList, launcherUrl, activityInfo.currentActivity, url => tasksModel.launcherPosition(url));
    }

    function isInCurrentActivity(activities) {
        return TaskHelpers.isInCurrentActivity(activities, activityInfo.currentActivity);
    }

    function publishNormalTask(key, qualifies, task) {
        if (!qualifies) {
            removeNormalTask(key);
            return;
        }

        const entries = Object.assign({}, normalTaskEntryMap);
        entries[key] = task;
        normalTaskEntryMap = entries;
        recomputeNormalTaskEntries();
    }

    function removeNormalTask(key) {
        if (!key || !normalTaskEntryMap[key]) {
            return;
        }

        const entries = Object.assign({}, normalTaskEntryMap);
        delete entries[key];
        normalTaskEntryMap = entries;
        recomputeNormalTaskEntries();
    }

    function recomputeNormalTaskEntries() {
        const result = TaskModelLogic.composeNormalTaskEntries(normalTaskEntryMap, normalTaskManualOrder, launcherUrl => visibleLauncherPosition(launcherUrl));
        normalTaskManualOrder = result.manualOrder;
        normalTaskEntries = result.entries;
    }

    function remoteAttentionKey(winIds, launcherUrl, title, row) {
        return TaskModelLogic.remoteAttentionKey(winIds, launcherUrl, title, row);
    }

    function publishRemoteAttention(previousKey, key, qualifies, task, becameQualified) {
        const result = TaskModelLogic.publishRemoteAttention(remoteAttentionEntryMap, remoteAttentionOrder, previousKey, key, qualifies, task, becameQualified);
        remoteAttentionEntryMap = result.entryMap;
        remoteAttentionOrder = result.order;
        applyRemoteAttentionSnapshot(result.snapshot);
        return result.publishedKey;
    }

    function removeRemoteAttention(key) {
        if (!key || !remoteAttentionEntryMap[key]) {
            return;
        }

        const result = TaskModelLogic.removeRemoteAttention(remoteAttentionEntryMap, remoteAttentionOrder, key);
        remoteAttentionEntryMap = result.entryMap;
        remoteAttentionOrder = result.order;
        applyRemoteAttentionSnapshot(result.snapshot);
    }

    function recomputeRemoteAttention() {
        applyRemoteAttentionSnapshot(TaskModelLogic.remoteAttentionSnapshot(remoteAttentionEntryMap, remoteAttentionOrder));
    }

    function applyRemoteAttentionSnapshot(snapshot) {
        remoteAttentionEntries = snapshot.entries;
        remoteAttentionCount = snapshot.count;
        remoteAttentionTarget = snapshot.target;
    }

    function activateRemoteAttention() {
        if (!remoteAttentionTarget || !TaskModelLogic.hasValidModelIndex(remoteAttentionTarget.modelIndex)) {
            return;
        }

        attentionTasksModel.requestActivate(remoteAttentionTarget.modelIndex);
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

    TaskManager.TasksModel {
        id: tasksModel

        activity: activityInfo.currentActivity
        filterByActivity: true
        filterByScreen: false
        filterByVirtualDesktop: true
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
            if (!root.updatingLauncherConfig) {
                root.persistLaunchers(launcherList);
            }
        }
    }

    TaskManager.TasksModel {
        id: attentionTasksModel

        activity: activityInfo.currentActivity
        filterByActivity: false
        filterByScreen: false
        filterByVirtualDesktop: false
        groupMode: TaskManager.TasksModel.GroupDisabled
        sortMode: TaskManager.TasksModel.SortManual
        virtualDesktop: virtualDesktopInfo.currentDesktop
    }

    QtQuick.Repeater {
        model: tasksModel

        delegate: QtQuick.Item {
            required property int index

            property string launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || "")
            property int launcherPosition: root.visibleLauncherPosition(launcherUrl, root.launcherRevision)
            property bool launcherPinned: launcherPosition !== -1
            property string publishedKey: ""
            property var taskInfo: TaskModelLogic.createNormalTaskEntry({
                activities: model.Activities,
                active: model.IsActive,
                appName: model.AppName,
                canLaunchNewInstance: model.CanLaunchNewInstance,
                canSetNoBorder: model.CanSetNoBorder,
                closable: model.IsClosable,
                demandingAttention: model.IsDemandingAttention,
                display: model.display,
                entryKey: publishedKey,
                fullScreenable: model.IsFullScreenable,
                hasLauncher: model.HasLauncher,
                hasNoBorder: model.HasNoBorder,
                iconSource: model.decoration,
                index,
                isExcludedFromCapture: model.IsExcludedFromCapture,
                isFullScreen: model.IsFullScreen,
                isKeepAbove: model.IsKeepAbove,
                isKeepBelow: model.IsKeepBelow,
                isLauncher: model.IsLauncher,
                isMaximizable: model.IsMaximizable,
                isMaximized: model.IsMaximized,
                isMinimizable: model.IsMinimizable,
                isMinimized: model.IsMinimized,
                isMovable: model.IsMovable,
                isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                isResizable: model.IsResizable,
                isShadeable: model.IsShadeable,
                isShaded: model.IsShaded,
                isStartup: model.IsStartup,
                isVirtualDesktopsChangeable: model.IsVirtualDesktopsChangeable,
                isWindow: model.IsWindow,
                launcherPinned,
                launcherPosition,
                launcherUrl,
                modelIndex: tasksModel.makePersistentModelIndex(index),
                virtualDesktops: model.VirtualDesktops
            })
            property bool qualifies: TaskModelLogic.qualifiesNormalTask(taskInfo, activities => root.isInCurrentActivity(activities), virtualDesktopInfo.currentDesktop)

            height: 0
            visible: false
            width: 0

            function syncTask() {
                if (!publishedKey) {
                    return;
                }

                const task = Object.assign({}, taskInfo);
                task.entryKey = publishedKey;
                root.publishNormalTask(publishedKey, qualifies, task);
            }

            QtQuick.Component.onCompleted: {
                publishedKey = root.createNormalTaskPublicationKey();
                syncTask();
            }
            QtQuick.Component.onDestruction: {
                root.removeNormalTask(publishedKey);
            }
            onIndexChanged: syncTask()
            onLauncherPinnedChanged: syncTask()
            onLauncherPositionChanged: syncTask()
            onQualifiesChanged: syncTask()
            onTaskInfoChanged: syncTask()
        }
    }

    QtQuick.Repeater {
        model: attentionTasksModel

        delegate: QtQuick.Item {
            required property int index

            property string launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || "")
            property bool hasSyncedAttention: false
            property string publishedKey: ""
            property bool previousQualifies: false
            property var taskInfo: TaskModelLogic.createRemoteAttentionEntry({
                activities: model.Activities,
                appName: model.AppName,
                demandingAttention: model.IsDemandingAttention,
                display: model.display,
                iconSource: model.decoration,
                index,
                isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                isWindow: model.IsWindow,
                launcherUrl,
                modelIndex: attentionTasksModel.makePersistentModelIndex(index),
                virtualDesktops: model.VirtualDesktops,
                winIds: model.WinIdList
            })
            property string taskKey: root.remoteAttentionKey(taskInfo.winIds, taskInfo.launcherUrl, taskInfo.title, index)
            property bool qualifies: TaskModelLogic.qualifiesRemoteAttention(taskInfo, activities => root.isInCurrentActivity(activities), virtualDesktopInfo.currentDesktop)

            height: 0
            visible: false
            width: 0

            function syncAttention() {
                const becameQualified = hasSyncedAttention && !previousQualifies && qualifies;
                publishedKey = root.publishRemoteAttention(publishedKey, taskKey, qualifies, taskInfo, becameQualified);
                previousQualifies = qualifies;
                hasSyncedAttention = true;
            }

            QtQuick.Component.onCompleted: syncAttention()
            QtQuick.Component.onDestruction: {
                root.removeRemoteAttention(publishedKey);
            }
            onQualifiesChanged: syncAttention()
            onTaskInfoChanged: syncAttention()
            onTaskKeyChanged: syncAttention()
        }
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        implicitWidth: Math.max(160, taskList.contentWidth + (attentionItem.visible ? attentionItem.implicitWidth + taskLayout.spacing : 0))
        implicitHeight: 40

        QtQuickLayouts.Layout.minimumWidth: implicitWidth
        QtQuickLayouts.Layout.preferredWidth: implicitWidth
        QtQuickLayouts.Layout.minimumHeight: implicitHeight
        QtQuickLayouts.Layout.preferredHeight: implicitHeight

        QtQuickLayouts.RowLayout {
            id: taskLayout
            anchors.fill: parent
            spacing: 2

            QtQuick.ListView {
                id: taskList

                QtQuickLayouts.Layout.fillHeight: true
                QtQuickLayouts.Layout.fillWidth: true
                QtQuickLayouts.Layout.preferredWidth: contentWidth

                boundsBehavior: QtQuick.Flickable.StopAtBounds
                clip: true
                interactive: contentWidth > width
                model: root.normalTaskEntries
                orientation: QtQuick.ListView.Horizontal
                spacing: 2

                delegate: TaskItem {
                    required property int index
                    required property var modelData

                    readonly property var entry: modelData || ({})

                    height: taskList.height
                    taskIndex: entry.moveIndex ?? entry.sourceIndex ?? -1
                    modelIndex: entry.modelIndex
                    slotNumber: index < 9 ? index + 1 : 0
                    title: entry.title || ""
                    iconSource: entry.iconSource || "application-x-executable"
                    active: entry.active || false
                    minimized: entry.isMinimized || false
                    launcher: entry.isLauncher || false
                    demandingAttention: entry.demandingAttention || false
                    pinned: entry.launcherBacked || false
                    dragMimeType: root.taskDragMimeType
                    hasLauncher: entry.hasLauncher || false
                    canDropTask: (sourceIndex, targetIndex) => root.canMoveTask(sourceIndex, targetIndex)

                    onActivated: {
                        root.activateTaskEntry(entry);
                    }

                    onContextMenuRequested: task => {
                        taskContextMenu.openForTask(task, this);
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

                QtQuickLayouts.Layout.fillHeight: true

                count: root.remoteAttentionCount
                iconSource: root.remoteAttentionTarget ? root.remoteAttentionTarget.iconSource : "dialog-warning"
                title: root.remoteAttentionTarget ? root.remoteAttentionTarget.title : ""
                visible: root.remoteAttentionCount > 0

                onActivated: {
                    root.activateRemoteAttention();
                }
            }
        }

        TaskContextMenu {
            id: taskContextMenu

            taskModel: tasksModel

            onPinRequested: launcherUrl => {
                root.pinLauncher(launcherUrl);
            }

            onUnpinRequested: launcherUrl => {
                root.unpinLauncher(launcherUrl);
            }

            onLauncherActivitiesChanged: {
                root.launcherRevision += 1;
                root.persistLaunchers(tasksModel.launcherList);
            }
        }
    }
}
