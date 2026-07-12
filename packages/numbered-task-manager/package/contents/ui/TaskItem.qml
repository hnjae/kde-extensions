// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.kirigami.platform as KirigamiPlatform
import "TaskEntryLogic.mjs" as TaskEntryLogic
import "TaskInteractionLogic.mjs" as TaskInteractionLogic
import "TaskMetricsLogic.mjs" as TaskMetricsLogic
import "TaskItemPresentationLogic.mjs" as TaskItemPresentationLogic
import "TaskVisualLogic.mjs" as TaskVisualLogic

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
    property bool vertical: false
    property int titleVisibilityThreshold: TaskMetricsLogic.titleVisibilityThreshold()
    property var iconSource: TaskEntryLogic.normalTaskIconFallback()
    property var modelIndex
    property var taskData: ({})
    property var canDropTask
    property bool dropHover: false
    property bool contextMenuOpen: false
    property bool dragReturnAnimationEnabled: false
    readonly property var itemPresentation: TaskItemPresentationLogic.taskItemPresentation({
        contentEndMargin: taskShell.contentBottomMargin,
        contentStartMargin: taskShell.contentTopMargin,
        frameExtent: height,
        minimumIconExtent: Kirigami.Units.iconSizes.small,
        slotNumber: root.slotNumber
    })
    readonly property int iconExtent: taskShell.iconExtent
    readonly property real naturalImplicitWidth: taskShell.naturalImplicitWidth
    readonly property string numberMode: itemPresentation.numberMode
    readonly property string slotLabel: itemPresentation.slotLabel
    readonly property bool titleVisible: taskShell.titleVisible
    readonly property bool visualHighlighted: taskShell.visualHighlighted

    signal activated(int taskIndex)
    signal contextMenuRequested(var request)
    signal taskDropped(int sourceIndex, int targetIndex, var drop)

    implicitWidth: taskShell.implicitWidth
    implicitHeight: taskShell.implicitHeight
    width: implicitWidth

    function beginTaskDrag() {
        root.dragReturnAnimationEnabled = false;
        dragSurface.beginDrag();
    }

    function finishTaskDrag() {
        dragSurface.finishDrag();
        root.dropHover = false;
        root.dragReturnAnimationEnabled = true;
    }

    function handleTaskDragEntered(drag) {
        const sourceIndex = TaskInteractionLogic.taskDropSourceIndex(drag.getDataAsString(root.dragMimeType));
        root.dropHover = TaskInteractionLogic.canAcceptTaskDrop(sourceIndex, root.taskIndex, root.canDropTask);
    }

    function handleTaskDragExited() {
        root.dropHover = false;
    }

    function handleTaskDrop(drop) {
        const sourceIndex = TaskInteractionLogic.taskDropSourceIndex(drop.getDataAsString(root.dragMimeType));
        root.dropHover = false;
        if (TaskInteractionLogic.canAcceptTaskDrop(sourceIndex, root.taskIndex, root.canDropTask)) {
            root.taskDropped(sourceIndex, root.taskIndex, drop);
        }
    }

    QtQuick.Item {
        id: dragSurface

        width: parent.width
        height: parent.height

        function beginDrag() {
            dragSurface.z = 1;
            Drag.active = true;
        }

        function finishDrag() {
            Drag.drop();
            Drag.active = false;
            dragSurface.x = 0;
            dragSurface.y = 0;
            dragSurface.z = 0;
        }

        QtQuick.Drag.active: false
        QtQuick.Drag.hotSpot.x: width / 2
        QtQuick.Drag.hotSpot.y: height / 2
        QtQuick.Drag.keys: root.dragMimeType ? [root.dragMimeType] : []
        QtQuick.Drag.mimeData: TaskInteractionLogic.taskDragMimeData(root.dragMimeType, root.taskIndex)
        QtQuick.Drag.source: root
        QtQuick.Drag.supportedActions: QtQuick.Qt.MoveAction

        TaskLikeItemShell {
            id: taskShell

            anchors.fill: parent
            active: root.active
            attention: root.demandingAttention
            contentOpacity: TaskVisualLogic.contentOpacity({
                active: root.active,
                attention: root.demandingAttention,
                dropHover: root.dropHover,
                highlighted: root.visualHighlighted,
                mutedLauncher: root.pinnedLauncherOnly
            })
            contextMenuOpen: root.contextMenuOpen
            dropHover: root.dropHover
            iconExtentOverride: root.itemPresentation.iconExtent
            launcher: root.launcher
            minimized: root.minimized
            mutedLauncher: root.pinnedLauncherOnly
            modelIndex: root.modelIndex
            naturalWidthMinimum: TaskMetricsLogic.normalNaturalWidthMinimum(root.showTitle)
            showTitle: root.showTitle
            slotWidth: root.slotWidth
            taskData: root.taskData
            titleVisibilityThreshold: root.titleVisibilityThreshold
            visualParent: root

            onActivated: {
                root.activated(root.taskIndex);
            }

            onContextMenuRequested: request => {
                root.contextMenuRequested(request);
            }

            TaskLikeContentSpacer {
                fill: !root.titleVisible && !root.pinnedLauncherOnly
            }

            QtQuick.Text {
                QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
                color: KirigamiPlatform.Theme.textColor
                font.family: KirigamiPlatform.Theme.fixedWidthFont.family
                font.bold: true
                text: root.slotLabel
                visible: root.numberMode === "prefix"
            }

            TaskLikeIconSlot {
                activeTask: root.active
                fallback: TaskEntryLogic.normalTaskIconFallback()
                highlighted: root.visualHighlighted
                iconExtent: root.iconExtent
                source: root.iconSource

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

            TaskLikeContentSpacer {
                fill: !root.titleVisible
            }
        }

        QtQuick.Behavior on x {
            enabled: root.dragReturnAnimationEnabled

            QtQuick.NumberAnimation {
                duration: 120
                easing.type: QtQuick.Easing.OutCubic
            }
        }

        QtQuick.Behavior on y {
            enabled: root.dragReturnAnimationEnabled

            QtQuick.NumberAnimation {
                duration: 120
                easing.type: QtQuick.Easing.OutCubic
            }
        }
    }

    QtQuick.DropArea {
        anchors.fill: parent
        keys: root.dragMimeType ? [root.dragMimeType] : []

        onEntered: drag => {
            root.handleTaskDragEntered(drag);
            drag.accepted = root.dropHover;
        }

        onExited: {
            root.handleTaskDragExited();
        }

        onDropped: drop => {
            root.handleTaskDrop(drop);
        }
    }

    QtQuick.DragHandler {
        id: dragHandler

        acceptedButtons: QtQuick.Qt.LeftButton
        enabled: root.taskIndex >= 0
        target: dragSurface
        xAxis.enabled: !root.vertical
        yAxis.enabled: root.vertical

        onActiveChanged: {
            if (active) {
                root.beginTaskDrag();
            } else {
                root.finishTaskDrag();
            }
        }
    }
}
