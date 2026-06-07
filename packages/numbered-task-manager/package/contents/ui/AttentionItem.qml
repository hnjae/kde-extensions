// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami
import org.kde.kirigami.platform as KirigamiPlatform
import org.kde.kirigami.primitives as KirigamiPrimitives
import "TaskMetricsLogic.js" as TaskMetricsLogic
import "TaskVisualLogic.js" as TaskVisualLogic

QtQuick.Item {
    id: root

    property int count: 0
    property string title: ""
    property real slotWidth: 0
    property bool showTitle: true
    property int titleVisibilityThreshold: 96
    property var iconSource: "dialog-warning"
    property var modelIndex
    property var taskData: ({})
    property bool contextMenuOpen: false
    readonly property real contentHorizontalPadding: taskFrame.contentLeftMargin + taskFrame.contentRightMargin + Kirigami.Units.smallSpacing * 2
    readonly property int iconExtent: TaskMetricsLogic.iconExtentForTaskFrame(height, taskFrame.contentTopMargin, taskFrame.contentBottomMargin, Kirigami.Units.iconSizes.small)
    readonly property real naturalImplicitWidth: Math.max(112, Math.min(220, contentRow.implicitWidth + contentHorizontalPadding))
    readonly property bool titleVisible: root.showTitle && (root.slotWidth <= 0 || root.slotWidth >= root.titleVisibilityThreshold)
    readonly property bool visualHighlighted: pointerHandler.hovered || root.activeFocus || root.contextMenuOpen

    signal activated
    signal contextMenuRequested(var request)

    implicitWidth: root.slotWidth > 0 ? root.slotWidth : naturalImplicitWidth
    implicitHeight: 40
    width: implicitWidth
    activeFocusOnTab: true

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    TaskFrame {
        id: taskFrame

        anchors.fill: parent
        attention: true
        hovered: root.visualHighlighted
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
            visible: !root.titleVisible

            QtQuickLayouts.Layout.fillWidth: !root.titleVisible
        }

        QtQuick.Item {
            id: iconContainer

            QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
            QtQuickLayouts.Layout.preferredHeight: root.iconExtent
            QtQuickLayouts.Layout.preferredWidth: QtQuickLayouts.Layout.preferredHeight

            KirigamiPrimitives.Icon {
                anchors.fill: parent
                active: TaskVisualLogic.iconActive({
                    highlighted: root.visualHighlighted
                })
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
            QtQuickLayouts.Layout.fillWidth: root.titleVisible
            color: KirigamiPlatform.Theme.textColor
            elide: QtQuick.Text.ElideRight
            maximumLineCount: 1
            text: root.title
            verticalAlignment: QtQuick.Text.AlignVCenter
            visible: root.titleVisible
        }

        QtQuick.Item {
            visible: !root.titleVisible

            QtQuickLayouts.Layout.fillWidth: !root.titleVisible
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
