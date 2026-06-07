// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import org.kde.taskmanager as TaskManager
import "RemoteAttentionLogic.js" as RemoteAttentionLogic
import "TaskActivityLogic.js" as TaskActivityLogic
import "TaskEntryLogic.js" as TaskEntryLogic
import "LauncherListLogic.js" as LauncherListLogic
import "NormalTaskStoreLogic.js" as NormalTaskStoreLogic
import "TaskMetricsLogic.js" as TaskMetricsLogic
import "TaskModelLogic.js" as TaskModelLogic
import "TaskActionLogic.js" as TaskActionLogic
import "VisibleTaskItemsLogic.js" as VisibleTaskItemsLogic

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    readonly property bool vertical: Plasmoid.formFactor === PlasmaCore.Types.Vertical
    property var normalTaskStoreState: NormalTaskStoreLogic.createNormalTaskStore()
    readonly property var normalTaskEntries: normalTaskStoreState.entries || []
    property var remoteAttentionState: RemoteAttentionLogic.createRemoteAttentionState()
    readonly property var visibleTaskItems: VisibleTaskItemsLogic.composeVisibleTaskItems(normalTaskEntries, {
        count: remoteAttentionState.count || 0,
        target: remoteAttentionState.target || null
    })
    property int launcherRevision: 0
    property var launcherReconciliationState: LauncherListLogic.createLauncherReconciliationState()
    property bool updatingLauncherConfig: false

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
            attentionTasksModel.requestActivate(result.modelIndex);
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

    function persistLaunchers(launchers) {
        const update = LauncherListLogic.launcherConfigUpdate(Plasmoid.configuration.launchers, launchers);
        if (!update.changed) {
            return LauncherListLogic.launcherConfigConvergence(update, Plasmoid.configuration.launchers);
        }

        const result = LauncherListLogic.runLauncherListUpdateTransaction(root, () => {
            Plasmoid.configuration.launchers = update.launchers;
            return LauncherListLogic.launcherConfigConvergence(update, Plasmoid.configuration.launchers);
        });
        recordLauncherSyncResult("persistLaunchers", result);
        return result;
    }

    function applyLauncherList(launchers) {
        const update = LauncherListLogic.launcherModelUpdate(tasksModel.launcherList, Plasmoid.configuration.launchers, launchers);
        if (!update.changed) {
            return false;
        }

        const result = LauncherListLogic.runLauncherListUpdateTransaction(root, () => {
            if (update.modelChanged) {
                tasksModel.launcherList = update.launchers;
            }
            if (update.configChanged) {
                Plasmoid.configuration.launchers = update.launchers;
            }
            return LauncherListLogic.launcherModelConvergence(update, tasksModel.launcherList, Plasmoid.configuration.launchers);
        });
        recordLauncherSyncResult("applyLauncherList", result);
        return Boolean(result && result.changed);
    }

    function recordLauncherSyncResult(action, result) {
        launcherReconciliationState = LauncherListLogic.launcherReconciliationAfterResult(launcherReconciliationState, result);
        logLauncherSyncResult(action, result);
    }

    function reconcileLauncherListChange(modelLaunchers) {
        const decision = LauncherListLogic.launcherReconciliationDecision(launcherReconciliationState, modelLaunchers, Plasmoid.configuration.launchers);
        launcherReconciliationState = decision.state;
        if (decision.action === "none") {
            return false;
        }

        if (decision.action === "retry") {
            applyLauncherList(decision.launchers);
            return true;
        }

        if (decision.action === "expired") {
            const expiredResult = LauncherListLogic.launcherModelConvergence({
                changed: true,
                launchers: decision.launchers || []
            }, modelLaunchers, Plasmoid.configuration.launchers);
            logLauncherSyncResult("reconcileLauncherList", Object.assign({}, expiredResult, {
                code: "reconciliation-expired",
                ok: false
            }));
        }

        return true;
    }

    function logLauncherSyncResult(action, result) {
        if (!result || result.ok) {
            return;
        }

        console.warn("Numbered Task Manager launcher sync " + action + " " + result.code + ": " + JSON.stringify({
            configLaunchers: result.configLaunchers || [],
            error: result.error || "",
            failedTargets: result.failedTargets || [],
            launchers: result.launchers || [],
            modelLaunchers: result.modelLaunchers || []
        }));
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

        persistLaunchers(tasksModel.launcherList);
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
            applyLauncherList(result.launchers);
        }
        return result;
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
        return TaskActivityLogic.isInCurrentActivity(activities, activityInfo.currentActivity);
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

    function publishRemoteAttention(previousKey, key, qualifies, task, becameQualified) {
        const result = RemoteAttentionLogic.publishRemoteAttentionState(remoteAttentionState, previousKey, key, qualifies, task, becameQualified);
        remoteAttentionState = result.state;
        return result.publishedKey;
    }

    function removeRemoteAttention(key) {
        const result = RemoteAttentionLogic.removeRemoteAttentionState(remoteAttentionState, key);
        if (result.state !== remoteAttentionState) {
            remoteAttentionState = result.state;
        }
    }

    function recomputeRemoteAttention() {
        remoteAttentionState = RemoteAttentionLogic.recomputeRemoteAttentionState(remoteAttentionState);
    }

    function activateRemoteAttention() {
        const visibleItem = VisibleTaskItemsLogic.visibleRemoteAttentionItem(visibleTaskItems);
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
                if (root.reconcileLauncherListChange(launcherList)) {
                    return;
                }
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
        taskModel: attentionTasksModel
        currentDesktop: virtualDesktopInfo.currentDesktop
        isInCurrentActivity: activities => root.isInCurrentActivity(activities)
        publishAttention: (previousKey, key, qualifies, task, becameQualified) => root.publishRemoteAttention(previousKey, key, qualifies, task, becameQualified)
        removeAttention: key => root.removeRemoteAttention(key)
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        readonly property int taskExtent: 40
        readonly property int titleVisibilityThreshold: 96
        readonly property real minimumReadableSlotWidth: taskExtent + 2 * Kirigami.Units.smallSpacing
        readonly property int visibleItemCount: root.visibleTaskItems.length
        readonly property real taskSlotWidth: root.vertical ? taskExtent : TaskMetricsLogic.taskSlotWidth(width, visibleItemCount, minimumReadableSlotWidth, 220)
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
                model: root.normalTaskEntries
                orientation: root.vertical ? QtQuick.ListView.Vertical : QtQuick.ListView.Horizontal
                spacing: 0

                delegate: TaskItem {
                    required property int index
                    required property var modelData

                    readonly property var entry: modelData || ({})
                    readonly property var visibleItem: VisibleTaskItemsLogic.visibleItemForNormalIndex(root.visibleTaskItems, index) || ({})

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
                QtQuickLayouts.Layout.preferredWidth: root.vertical ? implicitWidth : fullRepresentationItem.taskSlotWidth

                count: root.remoteAttentionState.count || 0
                iconSource: root.remoteAttentionState.target ? root.remoteAttentionState.target.iconSource : TaskEntryLogic.remoteAttentionIconFallback()
                modelIndex: root.remoteAttentionState.target ? root.remoteAttentionState.target.modelIndex : undefined
                slotWidth: root.vertical ? 0 : fullRepresentationItem.taskSlotWidth
                taskData: root.remoteAttentionState.target || {}
                title: root.remoteAttentionState.target ? root.remoteAttentionState.target.title : ""
                titleVisibilityThreshold: fullRepresentationItem.titleVisibilityThreshold
                visible: root.remoteAttentionState.count > 0

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
