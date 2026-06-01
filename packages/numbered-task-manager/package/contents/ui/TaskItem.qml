// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami.platform as KirigamiPlatform
import org.kde.kirigami.primitives as KirigamiPrimitives

QtQuick.Item {
    id: root

    property bool active: false
    property bool demandingAttention: false
    property bool hasLauncher: false
    property bool launcher: false
    property bool minimized: false
    property bool pinned: false
    property string dragMimeType: ""
    property int slotNumber: 0
    property int taskIndex: -1
    property string title: ""
    property var iconSource: "application-x-executable"
    property var modelIndex
    property var taskData: ({})
    property var canDropTask
    property bool dropHover: false
    readonly property int iconExtent: Math.max(16, Math.min(32, height - 8))
    readonly property bool badgeMode: slotNumber > 0 && iconExtent >= 24

    signal activated(int taskIndex)
    signal contextMenuRequested(var request)
    signal taskDropped(int sourceIndex, int targetIndex, var drop)

    implicitWidth: Math.max(96, Math.min(220, contentRow.implicitWidth + 16))
    implicitHeight: 40
    width: implicitWidth
    activeFocusOnTab: true

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    QtQuick.Rectangle {
        anchors.fill: parent
        color: root.active ? KirigamiPlatform.Theme.highlightColor : KirigamiPlatform.Theme.backgroundColor
        opacity: root.active || pointerHandler.hovered || root.dropHover ? 0.85 : 0
        radius: 4
    }

    QtQuickLayouts.RowLayout {
        id: contentRow

        anchors.fill: parent
        anchors.leftMargin: 6
        anchors.rightMargin: 6
        spacing: 6

        QtQuick.Text {
            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            color: root.active ? KirigamiPlatform.Theme.highlightedTextColor : KirigamiPlatform.Theme.textColor
            font.family: KirigamiPlatform.Theme.fixedWidthFont.family
            font.bold: true
            text: root.slotNumber > 0 ? root.slotNumber.toString() : ""
            visible: root.slotNumber > 0 && !root.badgeMode
        }

        QtQuick.Item {
            id: iconContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: root.iconExtent
            QtQuickLayouts.Layout.preferredWidth: root.iconExtent

            KirigamiPrimitives.Icon {
                anchors.fill: parent
                active: root.active || pointerHandler.hovered
                fallback: "application-x-executable"
                source: root.iconSource
            }

            NumberBadge {
                anchors.left: parent.left
                anchors.bottom: parent.bottom
                number: root.slotNumber
                scale: 0.85
                transformOrigin: QtQuick.Item.BottomLeft
                visible: root.badgeMode
            }
        }

        QtQuick.Text {
            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.fillWidth: true
            color: root.active ? KirigamiPlatform.Theme.highlightedTextColor : KirigamiPlatform.Theme.textColor
            elide: QtQuick.Text.ElideRight
            font.strikeout: root.minimized
            maximumLineCount: 1
            text: root.title
            verticalAlignment: QtQuick.Text.AlignVCenter
        }
    }

    QtQuick.Rectangle {
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        color: KirigamiPlatform.Theme.neutralTextColor
        height: 2
        radius: 1
        visible: root.demandingAttention || root.dropHover
    }

    QtQuick.Drag.active: dragHandler.active
    QtQuick.Drag.hotSpot.x: width / 2
    QtQuick.Drag.hotSpot.y: height / 2
    QtQuick.Drag.keys: root.dragMimeType ? [root.dragMimeType] : []
    QtQuick.Drag.mimeData: {
        if (!root.dragMimeType) {
            return {};
        }

        const data = {};
        data[root.dragMimeType] = root.taskIndex.toString();
        return data;
    }
    QtQuick.Drag.supportedActions: QtQuick.Qt.MoveAction

    QtQuick.DropArea {
        anchors.fill: parent
        keys: root.dragMimeType ? [root.dragMimeType] : []

        function sourceIndexFromDrop(drop) {
            const sourceIndex = Number(drop.getDataAsString(root.dragMimeType));
            return isNaN(sourceIndex) ? -1 : sourceIndex;
        }

        function acceptsDrop(sourceIndex) {
            if (sourceIndex === root.taskIndex) {
                return false;
            }

            if (typeof root.canDropTask !== "function") {
                return false;
            }

            return root.canDropTask(sourceIndex, root.taskIndex);
        }

        onEntered: drag => {
            const sourceIndex = sourceIndexFromDrop(drag);
            root.dropHover = acceptsDrop(sourceIndex);
        }

        onExited: {
            root.dropHover = false;
        }

        onDropped: drop => {
            const sourceIndex = sourceIndexFromDrop(drop);
            root.dropHover = false;
            if (acceptsDrop(sourceIndex)) {
                root.taskDropped(sourceIndex, root.taskIndex, drop);
            }
        }
    }

    QtQuick.DragHandler {
        id: dragHandler

        acceptedButtons: QtQuick.Qt.LeftButton
        enabled: root.taskIndex >= 0
    }

    QtQuick.Keys.onMenuPressed: contextMenuTimer.start()

    QtQuick.HoverHandler {
        id: pointerHandler
    }

    QtQuick.TapHandler {
        acceptedButtons: QtQuick.Qt.RightButton
        acceptedDevices: QtQuick.PointerDevice.Mouse | QtQuick.PointerDevice.TouchPad | QtQuick.PointerDevice.Stylus
        gesturePolicy: QtQuick.TapHandler.WithinBounds

        onPressedChanged: {
            if (pressed) {
                contextMenuTimer.start();
            }
        }
    }

    QtQuick.TapHandler {
        acceptedButtons: QtQuick.Qt.LeftButton

        onTapped: {
            root.activated(root.taskIndex);
        }
    }

    QtQuick.Timer {
        id: contextMenuTimer

        interval: 0

        onTriggered: {
            root.forceActiveFocus(QtQuick.Qt.MouseFocusReason);
            root.contextMenuRequested({
                modelIndex: root.modelIndex,
                task: root.taskData,
                visualParent: root
            });
        }
    }
}
