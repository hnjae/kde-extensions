// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.kirigami.platform as KirigamiPlatform
import "TaskEntryLogic.js" as TaskEntryLogic
import "TaskMetricsLogic.js" as TaskMetricsLogic

QtQuick.Item {
    id: root

    property int count: 0
    property string title: ""
    property real slotWidth: 0
    property bool showTitle: true
    property int titleVisibilityThreshold: TaskMetricsLogic.titleVisibilityThreshold()
    property var iconSource: TaskEntryLogic.remoteAttentionIconFallback()
    property var modelIndex
    property var taskData: ({})
    property bool contextMenuOpen: false
    readonly property int iconExtent: TaskMetricsLogic.iconExtentForTaskFrame(height, taskFrame.contentTopMargin, taskFrame.contentBottomMargin, Kirigami.Units.iconSizes.small)
    readonly property real naturalImplicitWidth: TaskMetricsLogic.taskNaturalImplicitWidth(TaskMetricsLogic.attentionNaturalWidthMinimum(), TaskMetricsLogic.maximumSlotWidth(), contentRow.implicitWidth, contentRow.horizontalPadding)
    readonly property bool titleVisible: TaskMetricsLogic.taskTitleVisible(root.showTitle, root.slotWidth, root.titleVisibilityThreshold)
    readonly property bool visualHighlighted: taskLikeInteraction.highlighted

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: TaskMetricsLogic.taskImplicitWidth(root.slotWidth, naturalImplicitWidth)
    implicitHeight: TaskMetricsLogic.taskExtent()
    width: implicitWidth
    activeFocusOnTab: true
    QtQuick.Keys.forwardTo: [taskLikeInteraction]

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    TaskLikeFrame {
        id: taskFrame

        anchors.fill: parent
        attention: true
        hovered: root.visualHighlighted
    }

    TaskLikeContentRow {
        id: contentRow

        frame: taskFrame

        TaskLikeContentSpacer {
            fill: !root.titleVisible
        }

        QtQuick.Item {
            id: iconContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: root.iconExtent
            QtQuickLayouts.Layout.preferredWidth: QtQuickLayouts.Layout.preferredHeight

            TaskLikeIcon {
                anchors.fill: parent
                fallback: TaskEntryLogic.remoteAttentionIconFallback()
                highlighted: root.visualHighlighted
                source: root.iconSource
            }

            NumberBadge {
                anchors.right: parent.right
                anchors.top: parent.top
                number: root.count
                scale: 0.78
                transformOrigin: QtQuick.Item.TopRight
                visible: root.count > 1
            }
        }

        TaskLikeTitle {
            title: root.title
            visible: root.titleVisible
        }

        TaskLikeContentSpacer {
            fill: !root.titleVisible
        }
    }

    TaskLikeInteraction {
        id: taskLikeInteraction

        contextMenuOpen: root.contextMenuOpen
        focusTarget: root
        modelIndex: root.modelIndex
        taskData: root.taskData
        visualParent: root

        onActivated: {
            root.activated();
        }

        onContextMenuRequested: request => {
            root.contextMenuRequested(request);
        }
    }
}
