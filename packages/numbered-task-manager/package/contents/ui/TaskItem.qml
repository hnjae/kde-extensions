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
    property bool dropHover: false
    readonly property int iconExtent: Math.max(16, Math.min(32, height - 8))
    readonly property bool badgeMode: slotNumber > 0 && iconExtent >= 24

    signal activated(int taskIndex)
    signal contextMenuRequested(var task)
    signal taskDropped(int sourceIndex, int targetIndex)

    implicitWidth: Math.max(96, Math.min(220, contentRow.implicitWidth + 16))
    implicitHeight: 40
    width: implicitWidth

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    QtQuick.Rectangle {
        anchors.fill: parent
        color: root.active ? KirigamiPlatform.Theme.highlightColor : KirigamiPlatform.Theme.backgroundColor
        opacity: root.active || pointerHandler.containsMouse || root.dropHover ? 0.85 : 0
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
                active: root.active || pointerHandler.containsMouse
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

        onEntered: drag => {
            const sourceIndex = Number(drag.getDataAsString(root.dragMimeType));
            root.dropHover = sourceIndex !== root.taskIndex;
        }

        onExited: {
            root.dropHover = false;
        }

        onDropped: drop => {
            root.dropHover = false;
            root.taskDropped(Number(drop.getDataAsString(root.dragMimeType)), root.taskIndex);
            drop.acceptProposedAction();
        }
    }

    QtQuick.DragHandler {
        id: dragHandler

        acceptedButtons: QtQuick.Qt.LeftButton
        enabled: root.taskIndex >= 0
    }

    QtQuick.MouseArea {
        id: pointerHandler

        anchors.fill: parent
        acceptedButtons: QtQuick.Qt.LeftButton | QtQuick.Qt.RightButton
        hoverEnabled: true

        onClicked: mouse => {
            if (mouse.button === QtQuick.Qt.RightButton) {
                root.contextMenuRequested(root.taskData);
            } else {
                root.activated(root.taskIndex);
            }
        }
    }
}
