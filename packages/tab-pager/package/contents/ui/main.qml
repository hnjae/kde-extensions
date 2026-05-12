// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.ksvg as KSvg
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

        QtQuickLayouts.Layout.minimumWidth: implicitWidth
        QtQuickLayouts.Layout.preferredWidth: implicitWidth
        QtQuickLayouts.Layout.maximumWidth: implicitWidth
        QtQuickLayouts.Layout.minimumHeight: implicitHeight
        QtQuickLayouts.Layout.preferredHeight: implicitHeight
        QtQuickLayouts.Layout.maximumHeight: implicitHeight

        clip: true

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

                delegate: QtQuick.Item {
                    id: desktopBox

                    required property bool active
                    required property int index
                    required property string label

                    readonly property var frameLayers: [
                        {
                            "prefix": "hover",
                            "z": 2
                        },
                        {
                            "prefix": "active",
                            "z": 3
                        },
                        {
                            "prefix": "normal",
                            "z": 4
                        },
                    ]
                    readonly property int horizontalPadding: fullRepresentationItem.horizontalPadding
                    readonly property int verticalPadding: fullRepresentationItem.verticalPadding

                    height: implicitHeight
                    implicitHeight: desktopLabel.implicitHeight + frameMetrics.margins.top + frameMetrics.margins.bottom + verticalPadding * 2
                    implicitWidth: desktopLabel.implicitWidth + frameMetrics.margins.left + frameMetrics.margins.right + horizontalPadding * 2
                    state: desktopMouseArea.containsMouse ? "hover" : active ? "active" : "normal"
                    width: implicitWidth

                    KSvg.FrameSvgItem {
                        id: frameMetrics

                        imagePath: "widgets/pager"
                        opacity: 0
                        prefix: "normal"
                    }

                    QtQuick.Repeater {
                        model: desktopBox.frameLayers

                        delegate: PagerFrame {
                            required property var modelData

                            desktopState: desktopBox.state
                            framePrefix: modelData.prefix
                            z: modelData.z
                        }
                    }

                    PlasmaComponents.Label {
                        id: desktopLabel

                        anchors {
                            fill: parent
                            bottomMargin: frameMetrics.margins.bottom + desktopBox.verticalPadding
                            leftMargin: frameMetrics.margins.left + desktopBox.horizontalPadding
                            rightMargin: frameMetrics.margins.right + desktopBox.horizontalPadding
                            topMargin: frameMetrics.margins.top + desktopBox.verticalPadding
                        }
                        font: backend.labelFont
                        horizontalAlignment: QtQuick.Text.AlignHCenter
                        text: desktopBox.label
                        verticalAlignment: QtQuick.Text.AlignVCenter
                        z: 9999
                    }

                    QtQuick.MouseArea {
                        anchors.fill: parent
                        cursorShape: QtQuick.Qt.PointingHandCursor
                        hoverEnabled: true

                        onClicked: backend.activate(desktopBox.index)
                    }
                }
            }
        }
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
