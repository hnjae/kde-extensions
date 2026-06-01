// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami.platform as KirigamiPlatform
import org.kde.kirigami.primitives as KirigamiPrimitives

QtQuick.Item {
    id: root

    property int count: 0
    property string title: ""
    property var iconSource: "dialog-warning"
    property var modelIndex
    property var taskData: ({})

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: Math.max(112, Math.min(220, contentRow.implicitWidth + 16))
    implicitHeight: 40
    width: implicitWidth
    activeFocusOnTab: true

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    QtQuick.Rectangle {
        anchors.fill: parent
        color: pointerHandler.hovered ? KirigamiPlatform.Theme.hoverColor : KirigamiPlatform.Theme.neutralBackgroundColor
        opacity: 0.9
        radius: 4
    }

    QtQuickLayouts.RowLayout {
        id: contentRow

        anchors.fill: parent
        anchors.leftMargin: 6
        anchors.rightMargin: 6
        spacing: 6

        QtQuick.Item {
            id: iconContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: Math.max(16, Math.min(32, root.height - 8))
            QtQuickLayouts.Layout.preferredWidth: QtQuickLayouts.Layout.preferredHeight

            KirigamiPrimitives.Icon {
                anchors.fill: parent
                active: pointerHandler.hovered
                fallback: "dialog-warning"
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

        QtQuick.Text {
            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.fillWidth: true
            color: KirigamiPlatform.Theme.textColor
            elide: QtQuick.Text.ElideRight
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
            root.activated();
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
