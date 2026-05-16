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
        if (!targetTask || !hasValidModelIndex(targetTask.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(targetTask.modelIndex);
    }

    function activateTaskEntry(task) {
        if (!task || task.sourceIndex === undefined || task.sourceIndex < 0 || !hasValidModelIndex(task.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(task.modelIndex);
    }

    function hasValidModelIndex(modelIndex) {
        return Boolean(modelIndex) && (modelIndex.valid === undefined || modelIndex.valid);
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
        const sourcePosition = pinnedLauncherGlobalPosition(sourceEntry);
        const targetPosition = pinnedLauncherGlobalPosition(targetEntry);
        if (!canMovePinnedLauncherPositions(sourcePosition, targetPosition)) {
            return false;
        }

        const launchers = normalizedLauncherList(tasksModel.launcherList);
        if (sourcePosition >= launchers.length || targetPosition >= launchers.length) {
            return false;
        }

        const nextLaunchers = launchers.slice();
        const movedLaunchers = nextLaunchers.splice(sourcePosition, 1);
        if (movedLaunchers.length !== 1) {
            return false;
        }

        nextLaunchers.splice(targetPosition, 0, movedLaunchers[0]);
        if (launcherListsEqual(launchers, nextLaunchers)) {
            return false;
        }

        persistLaunchers(nextLaunchers);
        return true;
    }

    function canMovePinnedLauncher(sourceEntry, targetEntry) {
        return canMovePinnedLauncherPositions(pinnedLauncherGlobalPosition(sourceEntry), pinnedLauncherGlobalPosition(targetEntry));
    }

    function canMovePinnedLauncherPositions(sourcePosition, targetPosition) {
        return sourcePosition >= 0 && targetPosition >= 0 && sourcePosition !== targetPosition;
    }

    function pinnedLauncherGlobalPosition(entry) {
        const launcherUrl = entry ? String(entry.pinnedLauncherUrl || entry.launcherUrl || "") : "";
        if (!launcherUrl) {
            return -1;
        }

        const directPosition = tasksModel.launcherPosition(launcherUrl);
        const launchers = normalizedLauncherList(tasksModel.launcherList);
        if (directPosition >= 0 && directPosition < launchers.length) {
            return directPosition;
        }

        for (let i = 0; i < launchers.length; ++i) {
            if (TaskHelpers.parseSerializedLauncher(launchers[i]).url === launcherUrl) {
                return i;
            }
        }

        return -1;
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

    function serializedLauncherVisibleInCurrentActivity(serializedLauncher, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? launcherRevision : launcherRevisionToken;
        if (!serializedLauncher) {
            return false;
        }

        if (revision < 0) {
            return false;
        }

        return TaskHelpers.serializedLauncherVisibleInActivity(serializedLauncher, activityInfo.currentActivity);
    }

    function visibleLauncherPosition(launcherUrl, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? launcherRevision : launcherRevisionToken;
        if (!launcherUrl) {
            return -1;
        }

        if (revision < 0) {
            return -1;
        }

        const launchers = normalizedLauncherList(tasksModel.launcherList);
        const globalPosition = tasksModel.launcherPosition(launcherUrl);
        if (globalPosition === -1) {
            return -1;
        }

        let visiblePosition = 0;
        for (let i = 0; i < launchers.length && i <= globalPosition; ++i) {
            if (!serializedLauncherVisibleInCurrentActivity(launchers[i], revision)) {
                continue;
            }

            if (i === globalPosition) {
                return visiblePosition;
            }

            visiblePosition += 1;
        }

        return -1;
    }

    function desktopId(desktop) {
        return TaskModelLogic.desktopId(desktop);
    }

    function desktopListContains(desktops, desktop) {
        return TaskModelLogic.desktopListContains(desktops, desktop);
    }

    function isOnCurrentVirtualDesktop(desktops, isOnAllDesktops) {
        return TaskModelLogic.isOnCurrentVirtualDesktop(desktops, isOnAllDesktops, virtualDesktopInfo.currentDesktop);
    }

    function isRemoteVirtualDesktop(desktops, isOnAllDesktops) {
        return TaskModelLogic.isRemoteVirtualDesktop(desktops, isOnAllDesktops, virtualDesktopInfo.currentDesktop);
    }

    function isInCurrentActivity(activities) {
        return TaskHelpers.isInCurrentActivity(activities, activityInfo.currentActivity);
    }

    function qualifiesNormalTask(isWindow, isLauncher, isStartup, desktops, isOnAllDesktops, activities) {
        if (!isInCurrentActivity(activities)) {
            return false;
        }

        if (isWindow) {
            return isOnCurrentVirtualDesktop(desktops, isOnAllDesktops);
        }

        return isLauncher || isStartup;
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
        if (!remoteAttentionTarget || !hasValidModelIndex(remoteAttentionTarget.modelIndex)) {
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
            property string title: model.display || model.AppName || ""
            property var taskInfo: ({
                    activities: Array.from(model.Activities || []),
                    active: model.IsActive || false,
                    canLaunchNewInstance: model.CanLaunchNewInstance || model.IsLauncher || false,
                    canSetNoBorder: model.CanSetNoBorder || false,
                    closable: model.IsClosable || false,
                    demandingAttention: model.IsDemandingAttention || false,
                    fullScreenable: model.IsFullScreenable || false,
                    hasAnyLauncher: model.HasLauncher || model.IsLauncher || launcherPinned,
                    hasLauncher: model.IsLauncher || launcherPinned,
                    hasNoBorder: model.HasNoBorder || false,
                    iconSource: model.decoration || "application-x-executable",
                    index,
                    entryKey: publishedKey,
                    isExcludedFromCapture: model.IsExcludedFromCapture || false,
                    isFullScreen: model.IsFullScreen || false,
                    isKeepAbove: model.IsKeepAbove || false,
                    isKeepBelow: model.IsKeepBelow || false,
                    isLauncher: model.IsLauncher || false,
                    isMaximizable: model.IsMaximizable || false,
                    isMaximized: model.IsMaximized || false,
                    isMinimizable: model.IsMinimizable || false,
                    isMinimized: model.IsMinimized || false,
                    isMovable: model.IsMovable || false,
                    isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops || false,
                    isResizable: model.IsResizable || false,
                    isShadeable: model.IsShadeable || false,
                    isShaded: model.IsShaded || false,
                    isStartup: model.IsStartup || false,
                    isVirtualDesktopsChangeable: model.IsVirtualDesktopsChangeable || false,
                    isWindow: model.IsWindow || false,
                    launcherBacked: false,
                    launcherPosition,
                    launcherUrl,
                    modelIndex: tasksModel.makePersistentModelIndex(index),
                    moveIndex: index,
                    sourceIndex: index,
                    title,
                    virtualDesktops: Array.from(model.VirtualDesktops || [])
                })
            property bool qualifies: root.qualifiesNormalTask(model.IsWindow || false, model.IsLauncher || false, model.IsStartup || false, model.VirtualDesktops || [], model.IsOnAllVirtualDesktops || false, model.Activities || [])

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
            property string taskKey: root.remoteAttentionKey(model.WinIdList || [], launcherUrl, title, index)
            property string title: model.display || model.AppName || ""
            property var taskInfo: ({
                    iconSource: model.decoration || "dialog-warning",
                    index,
                    modelIndex: attentionTasksModel.makePersistentModelIndex(index),
                    title
                })
            property bool qualifies: model.IsWindow && model.IsDemandingAttention && root.isInCurrentActivity(model.Activities || []) && root.isRemoteVirtualDesktop(model.VirtualDesktops || [], model.IsOnAllVirtualDesktops || false)

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
