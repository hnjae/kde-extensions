// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.plasma.components as PlasmaComponents
import org.kde.plasma.plasmoid

import io.github.hnjae.plasma.tabpager as TabPager

PlasmoidItem {
    id: root

    Plasmoid.icon: "user-desktop"
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Tab Pager"
    toolTipSubText: backend.count + " virtual desktops"

    TabPager.TabPagerBackend {
        id: backend
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        readonly property int horizontalPadding: Math.max(6, Math.round(labelMetrics.averageCharacterWidth))
        readonly property int verticalPadding: Math.max(3, Math.round(labelMetrics.height / 4))

        implicitWidth: Math.max(pagerRow.implicitWidth, 1)
        implicitHeight: Math.max(pagerRow.implicitHeight, 1)

        QtQuick.FontMetrics {
            id: labelMetrics

            font: backend.labelFont
        }

        QtQuick.MouseArea {
            anchors.fill: parent
            acceptedButtons: QtQuick.Qt.NoButton

            property int wheelDelta: 0

            onWheel: wheel => {
                const delta = (wheel.inverted ? -1 : 1) * (wheel.angleDelta.y || wheel.angleDelta.x);
                wheelDelta += delta;

                while (wheelDelta >= 120) {
                    wheelDelta -= 120;
                    backend.activatePrevious();
                }
                while (wheelDelta <= -120) {
                    wheelDelta += 120;
                    backend.activateNext();
                }
            }
        }

        QtQuick.Row {
            id: pagerRow

            spacing: 0

            QtQuick.Repeater {
                model: backend

                delegate: QtQuick.Rectangle {
                    id: desktopBox

                    required property bool active
                    required property int index
                    required property string label

                    readonly property int horizontalPadding: fullRepresentationItem.horizontalPadding
                    readonly property int verticalPadding: fullRepresentationItem.verticalPadding

                    border.color: active ? fullRepresentationItem.palette.active.highlight : fullRepresentationItem.palette.disabled.text
                    border.width: 1
                    color: active ? fullRepresentationItem.palette.active.highlight : "transparent"
                    height: implicitHeight
                    implicitHeight: desktopLabel.implicitHeight + verticalPadding * 2
                    implicitWidth: desktopLabel.implicitWidth + horizontalPadding * 2
                    width: implicitWidth

                    PlasmaComponents.Label {
                        id: desktopLabel

                        anchors.centerIn: parent
                        color: desktopBox.active ? fullRepresentationItem.palette.active.highlightedText : fullRepresentationItem.palette.active.text
                        font: backend.labelFont
                        horizontalAlignment: QtQuick.Text.AlignHCenter
                        text: desktopBox.label
                        verticalAlignment: QtQuick.Text.AlignVCenter
                    }

                    QtQuick.MouseArea {
                        anchors.fill: parent
                        cursorShape: QtQuick.Qt.PointingHandCursor

                        onClicked: backend.activate(desktopBox.index)
                    }
                }
            }
        }
    }
}
