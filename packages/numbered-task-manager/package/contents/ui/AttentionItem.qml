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

    signal activated

    implicitWidth: Math.max(112, Math.min(220, contentRow.implicitWidth + 16))
    implicitHeight: 40
    width: implicitWidth

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    QtQuick.Rectangle {
        anchors.fill: parent
        color: pointerHandler.containsMouse ? KirigamiPlatform.Theme.hoverColor : KirigamiPlatform.Theme.neutralBackgroundColor
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
                active: pointerHandler.containsMouse
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

    QtQuick.MouseArea {
        id: pointerHandler

        anchors.fill: parent
        acceptedButtons: QtQuick.Qt.LeftButton
        hoverEnabled: true

        onClicked: {
            root.activated();
        }
    }
}
