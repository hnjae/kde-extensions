// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.kirigami.platform as KirigamiPlatform
import "TaskEntryLogic.js" as TaskEntryLogic
import "TaskInteractionLogic.js" as TaskInteractionLogic
import "TaskMetricsLogic.js" as TaskMetricsLogic
import "TaskItemPresentationLogic.js" as TaskItemPresentationLogic
import "TaskVisualLogic.js" as TaskVisualLogic

QtQuick.Item {
    id: root

    property bool active: false
    property bool demandingAttention: false
    property bool launcher: false
    property bool minimized: false
    property bool pinnedLauncherOnly: false
    property string dragMimeType: ""
    property int slotNumber: 0
    property int taskIndex: -1
    property string title: ""
    property real slotWidth: 0
    property bool showTitle: true
    property int titleVisibilityThreshold: TaskMetricsLogic.titleVisibilityThreshold()
    property var iconSource: TaskEntryLogic.normalTaskIconFallback()
    property var modelIndex
    property var taskData: ({})
    property var canDropTask
    property bool dropHover: false
    property bool contextMenuOpen: false
    readonly property var itemPresentation: TaskItemPresentationLogic.taskItemPresentation({
        contentEndMargin: taskFrame.contentBottomMargin,
        contentStartMargin: taskFrame.contentTopMargin,
        frameExtent: height,
        minimumIconExtent: Kirigami.Units.iconSizes.small,
        slotNumber: root.slotNumber
    })
    readonly property int iconExtent: itemPresentation.iconExtent
    readonly property real naturalImplicitWidth: Math.max(TaskMetricsLogic.normalNaturalWidthMinimum(root.showTitle), Math.min(TaskMetricsLogic.maximumSlotWidth(), contentRow.implicitWidth + contentRow.horizontalPadding))
    readonly property string numberMode: itemPresentation.numberMode
    readonly property string slotLabel: itemPresentation.slotLabel
    readonly property bool titleVisible: TaskMetricsLogic.taskTitleVisible(root.showTitle, root.slotWidth, root.titleVisibilityThreshold)
    readonly property bool visualHighlighted: taskLikeInteraction.highlighted

    signal activated(int taskIndex)
    signal contextMenuRequested(var request)
    signal taskDropped(int sourceIndex, int targetIndex, var drop)

    implicitWidth: root.slotWidth > 0 ? root.slotWidth : naturalImplicitWidth
    implicitHeight: TaskMetricsLogic.taskExtent()
    width: implicitWidth
    activeFocusOnTab: true
    QtQuick.Keys.forwardTo: [taskLikeInteraction]

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    TaskLikeFrame {
        id: taskFrame

        anchors.fill: parent
        active: root.active
        attention: root.demandingAttention
        dropHover: root.dropHover
        hovered: root.visualHighlighted
        launcher: root.launcher
        minimized: root.minimized
        mutedLauncher: root.pinnedLauncherOnly
    }

    TaskLikeContentRow {
        id: contentRow

        contentOpacity: TaskVisualLogic.contentOpacity({
            active: root.active,
            attention: root.demandingAttention,
            dropHover: root.dropHover,
            highlighted: root.visualHighlighted,
            mutedLauncher: root.pinnedLauncherOnly
        })
        frame: taskFrame

        QtQuick.Item {
            visible: !root.titleVisible && !root.pinnedLauncherOnly

            QtQuickLayouts.Layout.fillWidth: !root.titleVisible && !root.pinnedLauncherOnly
        }

        QtQuick.Text {
            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            color: KirigamiPlatform.Theme.textColor
            font.family: KirigamiPlatform.Theme.fixedWidthFont.family
            font.bold: true
            text: root.slotLabel
            visible: root.numberMode === "prefix"
        }

        QtQuick.Item {
            id: iconOverlayContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: root.iconExtent
            QtQuickLayouts.Layout.preferredWidth: root.iconExtent

            TaskLikeIcon {
                anchors.fill: parent
                activeTask: root.active
                fallback: TaskEntryLogic.normalTaskIconFallback()
                highlighted: root.visualHighlighted
                source: root.iconSource
                z: 0
            }

            NumberBadge {
                anchors.left: parent.left
                anchors.bottom: parent.bottom
                number: root.slotNumber
                scale: 0.85
                transformOrigin: QtQuick.Item.BottomLeft
                visible: root.numberMode === "overlay"
                z: 1
            }
        }

        TaskLikeTitle {
            strikeout: root.minimized
            title: root.title
            visible: root.titleVisible
        }

        QtQuick.Item {
            visible: !root.titleVisible

            QtQuickLayouts.Layout.fillWidth: !root.titleVisible
        }
    }

    QtQuick.Drag.active: dragHandler.active
    QtQuick.Drag.hotSpot.x: width / 2
    QtQuick.Drag.hotSpot.y: height / 2
    QtQuick.Drag.keys: root.dragMimeType ? [root.dragMimeType] : []
    QtQuick.Drag.mimeData: TaskInteractionLogic.taskDragMimeData(root.dragMimeType, root.taskIndex)
    QtQuick.Drag.supportedActions: QtQuick.Qt.MoveAction

    QtQuick.DropArea {
        anchors.fill: parent
        keys: root.dragMimeType ? [root.dragMimeType] : []

        onEntered: drag => {
            const sourceIndex = TaskInteractionLogic.taskDropSourceIndex(drag.getDataAsString(root.dragMimeType));
            root.dropHover = TaskInteractionLogic.canAcceptTaskDrop(sourceIndex, root.taskIndex, root.canDropTask);
        }

        onExited: {
            root.dropHover = false;
        }

        onDropped: drop => {
            const sourceIndex = TaskInteractionLogic.taskDropSourceIndex(drop.getDataAsString(root.dragMimeType));
            root.dropHover = false;
            if (TaskInteractionLogic.canAcceptTaskDrop(sourceIndex, root.taskIndex, root.canDropTask)) {
                root.taskDropped(sourceIndex, root.taskIndex, drop);
            }
        }
    }

    QtQuick.DragHandler {
        id: dragHandler

        acceptedButtons: QtQuick.Qt.LeftButton
        enabled: root.taskIndex >= 0
    }

    TaskLikeInteraction {
        id: taskLikeInteraction

        contextMenuOpen: root.contextMenuOpen
        focusTarget: root
        modelIndex: root.modelIndex
        taskData: root.taskData
        visualParent: root

        onActivated: {
            root.activated(root.taskIndex);
        }

        onContextMenuRequested: request => {
            root.contextMenuRequested(request);
        }
    }
}
