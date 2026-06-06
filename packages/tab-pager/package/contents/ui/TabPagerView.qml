// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.Item {
    id: root

    required property var backend
    required property var model
    required property bool verticalPanel

    readonly property bool fillHeight: layoutMetrics.fillHeight
    readonly property bool fillWidth: layoutMetrics.fillWidth
    readonly property int horizontalPadding: Math.max(6, Math.round(labelMetrics.averageCharacterWidth))
    readonly property real maximumHeight: layoutMetrics.maximumHeight
    readonly property real maximumWidth: layoutMetrics.maximumWidth
    readonly property real minimumHeight: layoutMetrics.minimumHeight
    readonly property real minimumWidth: layoutMetrics.minimumWidth
    readonly property real preferredHeight: layoutMetrics.preferredHeight
    readonly property real preferredWidth: layoutMetrics.preferredWidth
    readonly property bool useFillAreaConstraintHint: layoutMetrics.useFillAreaConstraintHint
    readonly property int verticalPadding: Math.max(3, Math.round(labelMetrics.height / 4))

    implicitHeight: pagerDesktopStrip.implicitHeight
    implicitWidth: pagerDesktopStrip.implicitWidth

    clip: true

    QtQuick.FontMetrics {
        id: labelMetrics

        font: root.backend.labelFont
    }

    PagerLayoutMetrics {
        id: layoutMetrics

        contentImplicitHeight: pagerDesktopStrip.implicitHeight
        contentImplicitWidth: pagerDesktopStrip.implicitWidth
        verticalPanel: root.verticalPanel
    }

    QtQuick.MouseArea {
        anchors.fill: parent
        acceptedButtons: QtQuick.Qt.NoButton

        onWheel: wheel => {
            const delta = (wheel.inverted ? -1 : 1) * (wheel.angleDelta.y || wheel.angleDelta.x);
            root.backend.activateByWheelDelta(delta);
        }
    }

    PagerDesktopStrip {
        id: pagerDesktopStrip

        anchors {
            fill: parent
            bottomMargin: layoutMetrics.bottomInset
            leftMargin: layoutMetrics.leftInset
            rightMargin: layoutMetrics.rightInset
            topMargin: layoutMetrics.topInset
        }

        desktopGap: layoutMetrics.desktopGap
        horizontalPadding: root.horizontalPadding
        labelFont: root.backend.labelFont
        model: root.model
        verticalPanel: root.verticalPanel
        verticalPadding: root.verticalPadding

        onActivated: desktopIndex => root.backend.activate(desktopIndex)
    }
}
