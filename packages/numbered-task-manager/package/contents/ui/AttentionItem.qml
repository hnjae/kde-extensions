// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.kirigami.platform as KirigamiPlatform
import org.kde.kirigami.primitives as KirigamiPrimitives

QtQuick.Item {
    id: root

    property int count: 0
    property string title: ""
    property var iconSource: "dialog-warning"
    property var modelIndex
    property var taskData: ({})
    readonly property real contentHorizontalPadding: taskFrame.contentLeftMargin + taskFrame.contentRightMargin + Kirigami.Units.smallSpacing * 2
    readonly property int iconExtent: Math.max(16, Math.min(32, height - taskFrame.contentTopMargin - taskFrame.contentBottomMargin - Kirigami.Units.smallSpacing * 2))

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: Math.max(112, Math.min(220, contentRow.implicitWidth + contentHorizontalPadding))
    implicitHeight: 40
    width: implicitWidth
    activeFocusOnTab: true

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    TaskFrame {
        id: taskFrame

        anchors.fill: parent
        attention: true
        hovered: pointerHandler.hovered
    }

    QtQuickLayouts.RowLayout {
        id: contentRow

        anchors.fill: parent
        anchors.bottomMargin: taskFrame.contentBottomMargin
        anchors.leftMargin: taskFrame.contentLeftMargin + Kirigami.Units.smallSpacing
        anchors.rightMargin: taskFrame.contentRightMargin + Kirigami.Units.smallSpacing
        anchors.topMargin: taskFrame.contentTopMargin
        spacing: Kirigami.Units.smallSpacing

        QtQuick.Item {
            id: iconContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: root.iconExtent
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
