// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.taskmanager as TaskManager
import org.kde.plasma.plasmoid

PlasmoidItem {
    id: root

    readonly property string taskDragMimeType: "application/x-numbered-task-manager-row"
    property int remoteAttentionCount: 0
    property var remoteAttentionEntries: ({})
    property var remoteAttentionOrder: []
    property var remoteAttentionTarget: null
    property bool updatingLauncherConfig: false

    Plasmoid.icon: "preferences-system-windows"
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    function activateTaskAtIndex(index) {
        if (index === 9 && remoteAttentionTarget) {
            activateRemoteAttention();
            return;
        }

        const taskCount = tasksModel.count;
        if (taskCount <= 0) {
            return;
        }

        const targetIndex = index === 9 ? taskCount - 1 : index;
        if (targetIndex < 0 || targetIndex >= taskCount) {
            return;
        }

        tasksModel.requestActivate(tasksModel.makeModelIndex(targetIndex));
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
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            return;
        }

        const launcherCount = tasksModel.launcherCount;
        const sourcePinned = sourceIndex < launcherCount;
        const targetPinned = targetIndex < launcherCount;
        if (sourcePinned !== targetPinned) {
            return;
        }

        if (tasksModel.move(sourceIndex, targetIndex)) {
            tasksModel.syncLaunchers();
            persistLaunchers(tasksModel.launcherList);
        }
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

    function isRemoteVirtualDesktop(desktops, isOnAllDesktops) {
        return !isOnAllDesktops && !desktopListContains(desktops, virtualDesktopInfo.currentDesktop);
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

        const entries = Object.assign({}, remoteAttentionEntries);
        if (!entries[key]) {
            remoteAttentionOrder = remoteAttentionOrder.filter(existingKey => existingKey !== key).concat([key]);
        }
        entries[key] = task;
        remoteAttentionEntries = entries;
        recomputeRemoteAttention();
        return key;
    }

    function removeRemoteAttention(key) {
        if (!key || !remoteAttentionEntries[key]) {
            return;
        }

        const entries = Object.assign({}, remoteAttentionEntries);
        delete entries[key];
        remoteAttentionEntries = entries;
        remoteAttentionOrder = remoteAttentionOrder.filter(existingKey => existingKey !== key);
        recomputeRemoteAttention();
    }

    function recomputeRemoteAttention() {
        const keys = Object.keys(remoteAttentionEntries);
        remoteAttentionCount = keys.length;
        remoteAttentionTarget = null;

        for (let i = remoteAttentionOrder.length - 1; i >= 0; --i) {
            const key = remoteAttentionOrder[i];
            if (remoteAttentionEntries[key]) {
                remoteAttentionTarget = remoteAttentionEntries[key];
                return;
            }
        }
    }

    function activateRemoteAttention() {
        if (!remoteAttentionTarget) {
            return;
        }

        attentionTasksModel.requestActivate(remoteAttentionTarget.modelIndex);
    }

    TaskManager.ActivityInfo {
        id: activityInfo
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
            if (!root.updatingLauncherConfig) {
                root.persistLaunchers(launcherList);
            }
        }
    }

    TaskManager.TasksModel {
        id: attentionTasksModel

        activity: activityInfo.currentActivity
        filterByActivity: true
        filterByScreen: false
        filterByVirtualDesktop: false
        groupMode: TaskManager.TasksModel.GroupDisabled
        sortMode: TaskManager.TasksModel.SortManual
        virtualDesktop: virtualDesktopInfo.currentDesktop
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
            property bool qualifies: model.IsWindow && model.IsDemandingAttention && root.isRemoteVirtualDesktop(model.VirtualDesktops || [], model.IsOnAllVirtualDesktops || false)

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
                model: tasksModel
                orientation: QtQuick.ListView.Horizontal
                spacing: 2

                delegate: TaskItem {
                    required property int index

                    height: taskList.height
                    taskIndex: index
                    modelIndex: tasksModel.makeModelIndex(index)
                    slotNumber: index < 9 ? index + 1 : 0
                    title: model.display || model.AppName || ""
                    iconSource: model.decoration || "application-x-executable"
                    active: model.IsActive || false
                    minimized: model.IsMinimized || false
                    launcher: model.IsLauncher || false
                    demandingAttention: model.IsDemandingAttention || false
                    pinned: index < tasksModel.launcherCount
                    dragMimeType: root.taskDragMimeType
                    hasLauncher: model.HasLauncher || model.IsLauncher || false

                    onActivated: taskIndex => {
                        root.activateTaskAtIndex(taskIndex);
                    }

                    onContextMenuRequested: task => {
                        taskContextMenu.openForTask(task, this);
                    }

                    onTaskDropped: (sourceIndex, targetIndex) => {
                        root.moveTask(sourceIndex, targetIndex);
                    }

                    taskData: ({
                            canLaunchNewInstance: model.CanLaunchNewInstance || model.IsLauncher || false,
                            closable: model.IsClosable || false,
                            hasLauncher: model.HasLauncher || model.IsLauncher || false,
                            index,
                            isLauncher: model.IsLauncher || false,
                            isWindow: model.IsWindow || false,
                            launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || ""),
                            modelIndex: tasksModel.makeModelIndex(index),
                            title: model.display || model.AppName || ""
                        })
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
        }
    }
}
