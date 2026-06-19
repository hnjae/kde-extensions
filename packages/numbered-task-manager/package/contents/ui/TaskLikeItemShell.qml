// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.kirigami as Kirigami
import "TaskMetricsLogic.mjs" as TaskMetricsLogic

QtQuick.Item {
    id: root

    default property alias content: contentRow.data
    property bool active: false
    property bool attention: false
    property bool dropHover: false
    property bool launcher: false
    property bool minimized: false
    property bool mutedLauncher: false
    property bool contextMenuOpen: false
    property bool showTitle: true
    property int titleVisibilityThreshold: TaskMetricsLogic.titleVisibilityThreshold()
    property int iconExtentOverride: -1
    property real contentOpacity: 1
    property real naturalWidthMinimum: 0
    property real slotWidth: 0
    property var modelIndex
    property var taskData: ({})
    property var visualParent: root
    readonly property int contentBottomMargin: taskFrame.contentBottomMargin
    readonly property int contentTopMargin: taskFrame.contentTopMargin
    readonly property int iconExtent: root.iconExtentOverride >= 0 ? root.iconExtentOverride : TaskMetricsLogic.iconExtentForTaskFrame(root.height, taskFrame.contentTopMargin, taskFrame.contentBottomMargin, Kirigami.Units.iconSizes.small)
    readonly property real naturalImplicitWidth: TaskMetricsLogic.taskNaturalImplicitWidth(root.naturalWidthMinimum, TaskMetricsLogic.maximumSlotWidth(), contentRow.implicitWidth, contentRow.horizontalPadding)
    readonly property bool titleVisible: TaskMetricsLogic.taskTitleVisible(root.showTitle, root.slotWidth, root.titleVisibilityThreshold)
    readonly property bool visualHighlighted: taskLikeInteraction.highlighted

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: TaskMetricsLogic.taskImplicitWidth(root.slotWidth, root.naturalImplicitWidth)
    implicitHeight: TaskMetricsLogic.taskExtent()

    TaskLikeFrame {
        id: taskFrame

        anchors.fill: parent
        active: root.active
        attention: root.attention
        dropHover: root.dropHover
        hovered: root.visualHighlighted
        launcher: root.launcher
        minimized: root.minimized
        mutedLauncher: root.mutedLauncher
    }

    TaskLikeContentRow {
        id: contentRow

        contentOpacity: root.contentOpacity
        frame: taskFrame
    }

    TaskLikeInteraction {
        id: taskLikeInteraction

        contextMenuOpen: root.contextMenuOpen
        modelIndex: root.modelIndex
        taskData: root.taskData
        visualParent: root.visualParent

        onActivated: {
            root.activated();
        }

        onContextMenuRequested: request => {
            root.contextMenuRequested(request);
        }
    }
}
