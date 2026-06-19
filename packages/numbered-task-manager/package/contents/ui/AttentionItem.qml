// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskEntryLogic.mjs" as TaskEntryLogic
import "TaskMetricsLogic.mjs" as TaskMetricsLogic

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
    readonly property int iconExtent: taskShell.iconExtent
    readonly property real naturalImplicitWidth: taskShell.naturalImplicitWidth
    readonly property bool titleVisible: taskShell.titleVisible
    readonly property bool visualHighlighted: taskShell.visualHighlighted

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: taskShell.implicitWidth
    implicitHeight: taskShell.implicitHeight
    width: implicitWidth

    TaskLikeItemShell {
        id: taskShell

        anchors.fill: parent
        attention: true
        contextMenuOpen: root.contextMenuOpen
        modelIndex: root.modelIndex
        naturalWidthMinimum: TaskMetricsLogic.attentionNaturalWidthMinimum()
        showTitle: root.showTitle
        slotWidth: root.slotWidth
        taskData: root.taskData
        titleVisibilityThreshold: root.titleVisibilityThreshold
        visualParent: root

        onActivated: {
            root.activated();
        }

        onContextMenuRequested: request => {
            root.contextMenuRequested(request);
        }

        TaskLikeContentSpacer {
            fill: !root.titleVisible
        }

        TaskLikeIconSlot {
            fallback: TaskEntryLogic.remoteAttentionIconFallback()
            highlighted: root.visualHighlighted
            iconExtent: root.iconExtent
            source: root.iconSource

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
}
