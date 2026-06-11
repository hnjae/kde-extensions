// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import "TaskMetricsLogic.mjs" as TaskMetricsLogic

QtQuick.Item {
    id: root

    required property var activationAdapter
    required property var contextMenuAdapter
    required property var moveAdapter
    required property var remoteAttentionSource
    property var normalVisibleTaskItems: []
    property var visibleTaskItems: []
    property string taskDragMimeType: ""
    property bool vertical: false
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
            QtQuickLayouts.Layout.preferredHeight: root.vertical ? contentHeight : root.taskExtent
            QtQuickLayouts.Layout.preferredWidth: root.vertical ? root.taskExtent : contentWidth

            boundsBehavior: QtQuick.Flickable.StopAtBounds
            clip: true
            interactive: root.vertical ? contentHeight > height : contentWidth > width
            model: root.normalVisibleTaskItems
            orientation: root.vertical ? QtQuick.ListView.Vertical : QtQuick.ListView.Horizontal
            spacing: 0

            delegate: NormalTaskItem {
                required property var modelData

                activationAdapter: root.activationAdapter
                contextMenuAdapter: root.contextMenuAdapter
                moveAdapter: root.moveAdapter
                taskDragMimeType: root.taskDragMimeType
                taskListHeight: taskList.height
                taskListWidth: taskList.width
                taskSlotWidth: root.taskSlotWidth
                taskTitleVisibilityThreshold: root.titleVisibilityThreshold
                vertical: root.vertical
                visibleItem: modelData
            }
        }

        RemoteAttentionItem {
            id: attentionItem

            source: root.remoteAttentionSource
            taskSlotWidth: root.taskSlotWidth
            titleVisibilityThreshold: root.titleVisibilityThreshold
            vertical: root.vertical
        }
    }
}
