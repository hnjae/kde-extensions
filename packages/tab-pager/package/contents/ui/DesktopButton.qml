// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.ksvg as KSvg
import org.kde.plasma.components as PlasmaComponents

QtQuick.Item {
    id: root

    required property bool active
    required property int index
    required property string label

    property alias labelFont: desktopLabel.font
    property int horizontalPadding: 0
    property int verticalPadding: 0

    readonly property string desktopState: desktopMouseArea.containsMouse ? "hover" : root.active ? "active" : "normal"

    signal activated(int desktopIndex)

    height: implicitHeight
    implicitHeight: desktopLabel.implicitHeight + frameMetrics.margins.top + frameMetrics.margins.bottom + root.verticalPadding * 2
    implicitWidth: desktopLabel.implicitWidth + frameMetrics.margins.left + frameMetrics.margins.right + root.horizontalPadding * 2
    width: implicitWidth

    KSvg.FrameSvgItem {
        id: frameMetrics

        imagePath: "widgets/pager"
        opacity: 0
        prefix: "normal"
    }

    PagerFrame {
        desktopState: root.desktopState
        framePrefix: "hover"
        z: 2
    }

    PagerFrame {
        desktopState: root.desktopState
        framePrefix: "active"
        z: 3
    }

    PagerFrame {
        desktopState: root.desktopState
        framePrefix: "normal"
        z: 4
    }

    PlasmaComponents.Label {
        id: desktopLabel

        anchors {
            fill: parent
            bottomMargin: frameMetrics.margins.bottom + root.verticalPadding
            leftMargin: frameMetrics.margins.left + root.horizontalPadding
            rightMargin: frameMetrics.margins.right + root.horizontalPadding
            topMargin: frameMetrics.margins.top + root.verticalPadding
        }
        horizontalAlignment: QtQuick.Text.AlignHCenter
        text: root.label
        verticalAlignment: QtQuick.Text.AlignVCenter
        z: 9999
    }

    QtQuick.MouseArea {
        id: desktopMouseArea

        anchors.fill: parent
        cursorShape: QtQuick.Qt.PointingHandCursor
        hoverEnabled: true

        onClicked: root.activated(root.index)
    }

    component PagerFrame: KSvg.FrameSvgItem {
        required property string desktopState
        required property string framePrefix

        anchors.fill: parent
        imagePath: "widgets/pager"
        opacity: desktopState === framePrefix ? 1 : 0
        prefix: framePrefix
    }
}
