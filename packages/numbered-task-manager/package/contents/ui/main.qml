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
import "NormalTaskStoreLogic.js" as NormalTaskStoreLogic
import "TaskMetricsLogic.js" as TaskMetricsLogic
import "TaskModelLogic.js" as TaskModelLogic
import "TaskScopeLogic.js" as TaskScopeLogic
import "TaskActionLogic.js" as TaskActionLogic
import "VisibleTaskItemsLogic.js" as VisibleTaskItemsLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    readonly property bool vertical: Plasmoid.formFactor === PlasmaCore.Types.Vertical
    property var normalTaskStoreState: NormalTaskStoreLogic.createNormalTaskStore()
    readonly property var normalTaskEntries: normalTaskStoreState.entries || []
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

        requestActivation(result);
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

        requestActivation(result);
    }

    function requestActivation(result) {
        if (result.sourceModel === "remoteAttention") {
            remoteAttentionSource.requestActivate(result.modelIndex);
            return;
        }

        tasksModel.requestActivate(result.modelIndex);
    }

    function logActionResult(result) {
        if (!TaskActionLogic.shouldLogActionResult(result)) {
            return;
        }

        console.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }

    function pinLauncher(launcherUrl) {
        requestLauncherMutation("pinLauncher", launcherUrl, url => tasksModel.requestAddLauncher(url));
    }

    function unpinLauncher(launcherUrl) {
        requestLauncherMutation("unpinLauncher", launcherUrl, url => tasksModel.requestRemoveLauncher(url));
    }

    function requestLauncherMutation(action, launcherUrl, requestLauncher) {
        const request = TaskActionLogic.launcherMutationRequest(action, launcherUrl);
        if (!request.ok) {
            logActionResult(request);
            return false;
        }

        const result = TaskActionLogic.launcherMutationResult(request, requestLauncher(request.launcherUrl));
        if (!result.ok) {
            logActionResult(result);
            return false;
        }

        launcherSync.persistLaunchers(tasksModel.launcherList);
        return true;
    }

    function dispatchLauncherCommand(command) {
        const result = TaskActionLogic.contextMenuLauncherCommandDispatchResult(command);
        if (!result.ok) {
            logActionResult(result);
            return result;
        }

        if (result.action === "pinLauncher") {
            pinLauncher(result.launcherUrl);
            return result;
        }

        if (result.action === "unpinLauncher") {
            unpinLauncher(result.launcherUrl);
            return result;
        }

        if (result.action === "replaceLauncherList") {
            launcherSync.applyLauncherList(result.launchers);
        }
        return result;
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
            return moveManualTask(sourceEntry.entryKey, targetEntry.entryKey);
        }

        return movePinnedLauncher(sourceEntry, targetEntry);
    }

    function moveManualTask(sourceKey, targetKey) {
        const result = TaskModelLogic.moveManualTaskOrder(normalTaskEntries, sourceKey, targetKey);
        if (!result.moved) {
            return false;
        }

        normalTaskStoreState = Object.assign({}, normalTaskStoreState, {
            manualOrder: result.order
        });
        recomputeNormalTaskEntries();
        return true;
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

    function createNormalTaskPublicationKey() {
        const publication = NormalTaskStoreLogic.allocateNormalTaskPublication(normalTaskStoreState);
        normalTaskStoreState = publication.store;
        return publication.key;
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

    function publishNormalTask(key, qualifies, task) {
        const store = normalTaskStoreState;
        const nextStore = NormalTaskStoreLogic.publishNormalTask(store, key, qualifies, task, launcherUrl => visibleLauncherPosition(launcherUrl));
        if (nextStore !== store) {
            applyNormalTaskStore(nextStore);
        }
    }

    function removeNormalTask(key) {
        const store = normalTaskStoreState;
        const nextStore = NormalTaskStoreLogic.removeNormalTask(store, key, launcherUrl => visibleLauncherPosition(launcherUrl));
        if (nextStore !== store) {
            applyNormalTaskStore(nextStore);
        }
    }

    function applyNormalTaskStore(store) {
        normalTaskStoreState = store;
    }

    function recomputeNormalTaskEntries() {
        applyNormalTaskStore(NormalTaskStoreLogic.recomputeNormalTaskStore(normalTaskStoreState, launcherUrl => visibleLauncherPosition(launcherUrl)));
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

        requestActivation(result);
    }

    function openTaskContextMenu(request) {
        const menuRequest = TaskActionLogic.contextMenuRequestResult(request);
        if (!menuRequest.ok) {
            logActionResult(menuRequest);
            return;
        }

        const visualParent = menuRequest.visualParent;
        const menu = contextMenuComponent.createObject(visualParent, {
            launcherModel: tasksModel,
            modelIndex: menuRequest.modelIndex,
            task: menuRequest.task || {},
            taskModel: menuRequest.taskModel,
            visualParent: visualParent,
            visualParentWidth: menuRequest.visualParentWidth
        }) as TaskContextMenu;
        const creationResult = TaskActionLogic.contextMenuCreationResult(menu, menuRequest);
        if (!creationResult.ok) {
            logActionResult(creationResult);
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

        menu.launcherCommandRequested.connect(root.dispatchLauncherCommand);
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

    LauncherSyncAdapter {
        id: launcherSync

        configuration: Plasmoid.configuration
        taskModel: tasksModel
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
        createPublicationKey: () => root.createNormalTaskPublicationKey()
        isInCurrentActivity: activities => root.isInCurrentActivity(activities)
        visibleLauncherPosition: (launcherUrl, launcherRevisionToken) => root.visibleLauncherPosition(launcherUrl, launcherRevisionToken)

        onTaskPublished: (key, qualifies, task) => {
            root.publishNormalTask(key, qualifies, task);
        }
        onTaskRemoved: key => {
            root.removeNormalTask(key);
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
                    root.openTaskContextMenu(Object.assign({
                        taskModel: remoteAttentionSource.taskModel
                    }, request));
                }
            }
        }
    }
}
