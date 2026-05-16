// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.taskmanager as TaskManager
import org.kde.plasma.plasmoid

PlasmoidItem {
    id: root

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
        sortMode: TaskManager.TasksModel.SortManual
        virtualDesktop: virtualDesktopInfo.currentDesktop
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

                onActivated: taskIndex => {
                    root.activateTaskAtIndex(taskIndex);
                }
            }
        }
    }
}
