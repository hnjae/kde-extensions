// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "RemoteAttentionLogic.js" as RemoteAttentionLogic
import "TaskActivityLogic.js" as TaskActivityLogic
import "TaskEntryLogic.js" as TaskEntryLogic
import "LauncherListLogic.js" as LauncherListLogic
import "TaskModelLogic.js" as TaskModelLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    readonly property bool vertical: Plasmoid.formFactor === PlasmaCore.Types.Vertical
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
    Plasmoid.constraintHints: Plasmoid.CanFillArea
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    QtQuickLayouts.Layout.fillWidth: true
    QtQuickLayouts.Layout.fillHeight: true

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
        if (!targetTask || !TaskEntryLogic.hasValidModelIndex(targetTask.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(targetTask.modelIndex);
    }

    function activateTaskEntry(task) {
        if (!task || task.sourceIndex === undefined || task.sourceIndex < 0 || !TaskEntryLogic.hasValidModelIndex(task.modelIndex)) {
            return;
        }

        tasksModel.requestActivate(task.modelIndex);
    }

    function persistLaunchers(launchers) {
        const update = LauncherListLogic.launcherConfigUpdate(Plasmoid.configuration.launchers, launchers);
        if (!update.changed) {
            return;
        }

        updatingLauncherConfig = true;
        Plasmoid.configuration.launchers = update.launchers;
        updatingLauncherConfig = false;
    }

    function applyLauncherList(launchers) {
        const update = LauncherListLogic.launcherModelUpdate(tasksModel.launcherList, Plasmoid.configuration.launchers, launchers);
        if (!update.changed) {
            return false;
        }

        updatingLauncherConfig = true;
        if (update.modelChanged) {
            tasksModel.launcherList = update.launchers;
        }
        if (update.configChanged) {
            Plasmoid.configuration.launchers = update.launchers;
        }
        updatingLauncherConfig = false;
        return true;
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
        const result = LauncherListLogic.movePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
        if (!result.moved) {
            return false;
        }

        return applyLauncherList(result.launchers);
    }

    function canMovePinnedLauncher(sourceEntry, targetEntry) {
        return LauncherListLogic.canMovePinnedLauncher(tasksModel.launcherList, sourceEntry, targetEntry, launcherUrl => tasksModel.launcherPosition(launcherUrl));
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
        return TaskActivityLogic.isInCurrentActivity(activities, activityInfo.currentActivity);
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
        return RemoteAttentionLogic.remoteAttentionKey(winIds, launcherUrl, title, row);
    }

    function publishRemoteAttention(previousKey, key, qualifies, task, becameQualified) {
        const result = RemoteAttentionLogic.publishRemoteAttention(remoteAttentionEntryMap, remoteAttentionOrder, previousKey, key, qualifies, task, becameQualified);
        remoteAttentionEntryMap = result.entryMap;
        remoteAttentionOrder = result.order;
        applyRemoteAttentionSnapshot(result.snapshot);
        return result.publishedKey;
    }

    function removeRemoteAttention(key) {
        if (!key || !remoteAttentionEntryMap[key]) {
            return;
        }

        const result = RemoteAttentionLogic.removeRemoteAttention(remoteAttentionEntryMap, remoteAttentionOrder, key);
        remoteAttentionEntryMap = result.entryMap;
        remoteAttentionOrder = result.order;
        applyRemoteAttentionSnapshot(result.snapshot);
    }

    function recomputeRemoteAttention() {
        applyRemoteAttentionSnapshot(RemoteAttentionLogic.remoteAttentionSnapshot(remoteAttentionEntryMap, remoteAttentionOrder));
    }

    function applyRemoteAttentionSnapshot(snapshot) {
        remoteAttentionEntries = snapshot.entries;
        remoteAttentionCount = snapshot.count;
        remoteAttentionTarget = snapshot.target;
    }

    function activateRemoteAttention() {
        if (!remoteAttentionTarget || !TaskEntryLogic.hasValidModelIndex(remoteAttentionTarget.modelIndex)) {
            return;
        }

        attentionTasksModel.requestActivate(remoteAttentionTarget.modelIndex);
    }

    function openTaskContextMenu(request) {
        const menuRequest = request || {};
        if (!menuRequest.visualParent || !menuRequest.taskModel || !TaskEntryLogic.hasValidModelIndex(menuRequest.modelIndex)) {
            return;
        }

        const visualParent = menuRequest.visualParent;
        const menu = contextMenuComponent.createObject(menuRequest.visualParent, {
            launcherModel: tasksModel,
            modelIndex: menuRequest.modelIndex,
            task: menuRequest.task || {},
            taskModel: menuRequest.taskModel,
            visualParent: menuRequest.visualParent,
            visualParentWidth: menuRequest.visualParent.width || 0
        }) as TaskContextMenu;
        if (!menu) {
            return;
        }

        if (visualParent.contextMenuOpen !== undefined) {
            visualParent.contextMenuOpen = true;
            menu.closed.connect(() => {
                if (visualParent.contextMenuOpen !== undefined) {
                    visualParent.contextMenuOpen = false;
                }
            });
        }

        menu.pinRequested.connect(root.pinLauncher);
        menu.unpinRequested.connect(root.unpinLauncher);
        menu.launcherListChangeRequested.connect(root.applyLauncherList);
        menu.show();
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

    QtQuick.Component {
        id: contextMenuComponent

        TaskContextMenu {}
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
            required property var model

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
            }, TaskEntryLogic)
            property bool qualifies: TaskModelLogic.qualifiesNormalTask(taskInfo, activities => root.isInCurrentActivity(activities), virtualDesktopInfo.currentDesktop, TaskEntryLogic)

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
            required property var model

            property string launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || "")
            property bool hasSyncedAttention: false
            property string publishedKey: ""
            property bool previousQualifies: false
            property var taskInfo: RemoteAttentionLogic.createRemoteAttentionEntry({
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
            }, TaskEntryLogic)
            property string taskKey: root.remoteAttentionKey(taskInfo.winIds, taskInfo.launcherUrl, taskInfo.title, index)
            property bool qualifies: RemoteAttentionLogic.qualifiesRemoteAttention(taskInfo, activities => root.isInCurrentActivity(activities), virtualDesktopInfo.currentDesktop, TaskEntryLogic)

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

        readonly property int taskExtent: 40
        readonly property real attentionLongExtent: attentionItem.visible ? (root.vertical ? attentionItem.implicitHeight + taskLayout.rowSpacing : attentionItem.implicitWidth + taskLayout.columnSpacing) : 0

        implicitWidth: root.vertical ? Math.max(96, Math.max(taskList.contentWidth, attentionItem.visible ? attentionItem.implicitWidth : 0)) : Math.max(160, taskList.contentWidth + attentionLongExtent)
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
                model: root.normalTaskEntries
                orientation: root.vertical ? QtQuick.ListView.Vertical : QtQuick.ListView.Horizontal
                spacing: 0

                delegate: TaskItem {
                    required property int index
                    required property var modelData

                    readonly property var entry: modelData || ({})

                    height: root.vertical ? implicitHeight : taskList.height
                    width: root.vertical ? taskList.width : implicitWidth
                    taskIndex: entry.moveIndex ?? entry.sourceIndex ?? -1
                    modelIndex: entry.modelIndex
                    slotNumber: index < 9 ? index + 1 : 0
                    title: entry.title || ""
                    iconSource: entry.iconSource || "application-x-executable"
                    active: entry.active || false
                    minimized: entry.isMinimized || false
                    launcher: entry.isLauncher || false
                    demandingAttention: entry.demandingAttention || false
                    dragMimeType: root.taskDragMimeType
                    canDropTask: (sourceIndex, targetIndex) => root.canMoveTask(sourceIndex, targetIndex)

                    onActivated: {
                        root.activateTaskEntry(entry);
                    }

                    onContextMenuRequested: request => {
                        root.openTaskContextMenu(Object.assign({
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

                QtQuickLayouts.Layout.fillHeight: !root.vertical
                QtQuickLayouts.Layout.fillWidth: root.vertical

                count: root.remoteAttentionCount
                iconSource: root.remoteAttentionTarget ? root.remoteAttentionTarget.iconSource : "dialog-warning"
                modelIndex: root.remoteAttentionTarget ? root.remoteAttentionTarget.modelIndex : undefined
                taskData: root.remoteAttentionTarget || {}
                title: root.remoteAttentionTarget ? root.remoteAttentionTarget.title : ""
                visible: root.remoteAttentionCount > 0

                onActivated: {
                    root.activateRemoteAttention();
                }

                onContextMenuRequested: request => {
                    root.openTaskContextMenu(Object.assign({
                        taskModel: attentionTasksModel
                    }, request));
                }
            }
        }
    }
}
