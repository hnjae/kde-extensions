// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.taskmanager as TaskManager
import org.kde.plasma.plasmoid

PlasmoidItem {
    id: root

    readonly property string nullActivityId: "00000000-0000-0000-0000-000000000000"
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

        tasksModel.requestActivate(normalTaskEntries[targetIndex].modelIndex);
    }

    function activateTaskEntry(task) {
        if (!task || task.sourceIndex === undefined || task.sourceIndex < 0) {
            return;
        }

        tasksModel.requestActivate(task.modelIndex);
    }

    function normalizedLauncherList(value) {
        if (!value) {
            return [];
        }

        return Array.from(value).filter(launcher => launcher && launcher.length > 0);
    }

    function launcherListsEqual(left, right) {
        const leftList = normalizedLauncherList(left);
        const rightList = normalizedLauncherList(right);
        if (leftList.length !== rightList.length) {
            return false;
        }

        for (let i = 0; i < leftList.length; ++i) {
            if (leftList[i] !== rightList[i]) {
                return false;
            }
        }

        return true;
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

        if (tasksModel.move(sourceIndex, targetIndex)) {
            tasksModel.syncLaunchers();
            persistLaunchers(tasksModel.launcherList);
            return true;
        }

        return false;
    }

    function moveManualTask(sourceKey, targetKey) {
        const order = normalTaskEntries.filter(entry => !entry.launcherBacked).map(entry => entry.entryKey);
        const sourcePosition = order.indexOf(sourceKey);
        const targetPosition = order.indexOf(targetKey);
        if (sourcePosition === -1 || targetPosition === -1 || sourcePosition === targetPosition) {
            return false;
        }

        order.splice(sourcePosition, 1);
        order.splice(targetPosition, 0, sourceKey);
        normalTaskManualOrder = order;
        recomputeNormalTaskEntries();
        return true;
    }

    function canMoveTask(sourceIndex, targetIndex) {
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            return false;
        }

        const sourceEntry = normalTaskEntryForSourceIndex(sourceIndex);
        const targetEntry = normalTaskEntryForSourceIndex(targetIndex);
        if (!sourceEntry || !targetEntry) {
            return false;
        }

        return Boolean(sourceEntry.launcherBacked) === Boolean(targetEntry.launcherBacked);
    }

    function normalTaskEntryForSourceIndex(sourceIndex) {
        const entries = normalTaskEntries || [];
        for (let i = 0; i < entries.length; ++i) {
            if (entries[i].sourceIndex === sourceIndex) {
                return entries[i];
            }
        }

        return null;
    }

    function createNormalTaskPublicationKey() {
        nextNormalTaskPublicationId += 1;
        return "normal:" + nextNormalTaskPublicationId.toString();
    }

    function stringListContains(list, value) {
        const needle = String(value);
        const values = Array.from(list || []);
        for (let i = 0; i < values.length; ++i) {
            if (String(values[i]) === needle) {
                return true;
            }
        }

        return false;
    }

    function serializedLauncherActivities(serializedLauncher) {
        const launcher = String(serializedLauncher || "");
        if (!launcher.startsWith("[")) {
            return [];
        }

        const separator = launcher.indexOf("]\n");
        if (separator === -1) {
            return [];
        }

        const activityText = launcher.slice(1, separator);
        if (!activityText) {
            return [];
        }

        return activityText.split(",").filter(activityId => activityId.length > 0);
    }

    function serializedLauncherVisibleInCurrentActivity(serializedLauncher, launcherRevisionToken) {
        const revision = launcherRevisionToken === undefined ? launcherRevision : launcherRevisionToken;
        if (!serializedLauncher) {
            return false;
        }

        if (revision < 0) {
            return false;
        }

        const currentActivity = String(activityInfo.currentActivity || "");
        if (!currentActivity) {
            return true;
        }

        const launcherActivities = serializedLauncherActivities(serializedLauncher);
        if (launcherActivities.length === 0 || stringListContains(launcherActivities, nullActivityId)) {
            return true;
        }

        return stringListContains(launcherActivities, currentActivity);
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

    function isLauncherBackedRow(isLauncher, launcherUrl, sourceIndex, launcherRevisionToken) {
        if (isLauncher) {
            return true;
        }

        const position = visibleLauncherPosition(launcherUrl, launcherRevisionToken);
        return position !== -1 && sourceIndex === position;
    }

    function desktopId(desktop) {
        if (!desktop) {
            return "";
        }

        if (typeof desktop === "string") {
            return desktop;
        }

        if (desktop.id) {
            return String(desktop.id);
        }

        return String(desktop);
    }

    function desktopListContains(desktops, desktop) {
        const currentDesktopId = desktopId(desktop);
        if (!currentDesktopId) {
            return false;
        }

        const desktopList = Array.from(desktops || []);
        for (let i = 0; i < desktopList.length; ++i) {
            if (desktopId(desktopList[i]) === currentDesktopId) {
                return true;
            }
        }

        return false;
    }

    function isOnCurrentVirtualDesktop(desktops, isOnAllDesktops) {
        if (isOnAllDesktops) {
            return true;
        }

        return desktopListContains(desktops, virtualDesktopInfo.currentDesktop);
    }

    function isRemoteVirtualDesktop(desktops, isOnAllDesktops) {
        if (isOnAllDesktops) {
            return false;
        }

        const desktopList = Array.from(desktops || []);
        return desktopList.length > 0 && !desktopListContains(desktopList, virtualDesktopInfo.currentDesktop);
    }

    function isInCurrentActivity(activities) {
        const currentActivity = String(activityInfo.currentActivity || "");
        if (!currentActivity) {
            return true;
        }

        const activityList = Array.from(activities || []);
        if (activityList.length === 0) {
            return true;
        }

        for (let i = 0; i < activityList.length; ++i) {
            if (String(activityList[i]) === currentActivity) {
                return true;
            }
        }

        return false;
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
        const entries = Object.keys(normalTaskEntryMap).map(key => normalTaskEntryMap[key]);
        const pinnedEntries = entries.filter(entry => entry.launcherBacked);
        const unpinnedEntries = entries.filter(entry => !entry.launcherBacked);
        const unpinnedByKey = {};

        pinnedEntries.sort((left, right) => left.sourceIndex - right.sourceIndex);
        unpinnedEntries.sort((left, right) => left.sourceIndex - right.sourceIndex);

        for (let i = 0; i < unpinnedEntries.length; ++i) {
            unpinnedByKey[unpinnedEntries[i].entryKey] = unpinnedEntries[i];
        }

        const orderedUnpinnedEntries = [];
        const nextManualOrder = [];
        const manualOrder = Array.from(normalTaskManualOrder || []);
        for (let i = 0; i < manualOrder.length; ++i) {
            const key = manualOrder[i];
            if (unpinnedByKey[key]) {
                orderedUnpinnedEntries.push(unpinnedByKey[key]);
                nextManualOrder.push(key);
                delete unpinnedByKey[key];
            }
        }

        for (let i = 0; i < unpinnedEntries.length; ++i) {
            const entry = unpinnedEntries[i];
            if (unpinnedByKey[entry.entryKey]) {
                orderedUnpinnedEntries.push(entry);
                nextManualOrder.push(entry.entryKey);
            }
        }

        normalTaskManualOrder = nextManualOrder;
        normalTaskEntries = pinnedEntries.concat(orderedUnpinnedEntries);
    }

    function remoteAttentionKey(winIds, launcherUrl, title, row) {
        const windowIds = Array.from(winIds || []);
        if (windowIds.length > 0) {
            return "window:" + windowIds.join(",");
        }

        return "row:" + row.toString() + ":" + launcherUrl + ":" + title;
    }

    function publishRemoteAttention(previousKey, key, qualifies, task) {
        if (previousKey && previousKey !== key) {
            removeRemoteAttention(previousKey);
        }

        if (!qualifies) {
            removeRemoteAttention(key);
            return "";
        }

        const entries = Object.assign({}, remoteAttentionEntryMap);
        if (!entries[key]) {
            remoteAttentionOrder = remoteAttentionOrder.filter(existingKey => existingKey !== key).concat([key]);
        }
        entries[key] = task;
        remoteAttentionEntryMap = entries;
        recomputeRemoteAttention();
        return key;
    }

    function removeRemoteAttention(key) {
        if (!key || !remoteAttentionEntryMap[key]) {
            return;
        }

        const entries = Object.assign({}, remoteAttentionEntryMap);
        delete entries[key];
        remoteAttentionEntryMap = entries;
        remoteAttentionOrder = remoteAttentionOrder.filter(existingKey => existingKey !== key);
        recomputeRemoteAttention();
    }

    function recomputeRemoteAttention() {
        const entries = [];
        remoteAttentionTarget = null;

        for (let i = 0; i < remoteAttentionOrder.length; ++i) {
            const key = remoteAttentionOrder[i];
            if (remoteAttentionEntryMap[key]) {
                entries.push(remoteAttentionEntryMap[key]);
            }
        }

        remoteAttentionEntries = entries;
        remoteAttentionCount = entries.length;
        remoteAttentionTarget = entries.length > 0 ? entries[entries.length - 1] : null;
    }

    function activateRemoteAttention() {
        if (!remoteAttentionTarget) {
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
        hideActivatedLaunchers: true
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
            property bool launcherPinned: root.visibleLauncherPosition(launcherUrl, root.launcherRevision) !== -1
            property bool launcherBacked: root.isLauncherBackedRow(model.IsLauncher || false, launcherUrl, index, root.launcherRevision)
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
                    launcherBacked,
                    launcherUrl,
                    modelIndex: tasksModel.makeModelIndex(index),
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
            onLauncherBackedChanged: syncTask()
            onLauncherPinnedChanged: syncTask()
            onQualifiesChanged: syncTask()
            onTaskInfoChanged: syncTask()
        }
    }

    QtQuick.Repeater {
        model: attentionTasksModel

        delegate: QtQuick.Item {
            required property int index

            property string launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || "")
            property string publishedKey: ""
            property string taskKey: root.remoteAttentionKey(model.WinIdList || [], launcherUrl, title, index)
            property string title: model.display || model.AppName || ""
            property var taskInfo: ({
                    iconSource: model.decoration || "dialog-warning",
                    index,
                    modelIndex: attentionTasksModel.makeModelIndex(index),
                    title
                })
            property bool qualifies: model.IsWindow && model.IsDemandingAttention && root.isInCurrentActivity(model.Activities || []) && root.isRemoteVirtualDesktop(model.VirtualDesktops || [], model.IsOnAllVirtualDesktops || false)

            height: 0
            visible: false
            width: 0

            function syncAttention() {
                publishedKey = root.publishRemoteAttention(publishedKey, taskKey, qualifies, taskInfo);
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
                    taskIndex: entry.sourceIndex ?? -1
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
            }
        }
    }
}
