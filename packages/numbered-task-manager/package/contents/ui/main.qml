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
    property bool updatingLauncherConfig: false

    Plasmoid.icon: "preferences-system-windows"
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Numbered Task Manager"

    function activateTaskAtIndex(index) {
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

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        implicitWidth: Math.max(160, taskList.contentWidth)
        implicitHeight: 40

        QtQuickLayouts.Layout.minimumWidth: implicitWidth
        QtQuickLayouts.Layout.preferredWidth: implicitWidth
        QtQuickLayouts.Layout.minimumHeight: implicitHeight
        QtQuickLayouts.Layout.preferredHeight: implicitHeight

        QtQuick.ListView {
            id: taskList

            anchors.fill: parent
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
