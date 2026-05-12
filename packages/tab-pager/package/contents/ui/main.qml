// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
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

            onWheel: wheel => {
                const delta = (wheel.inverted ? -1 : 1) * (wheel.angleDelta.y || wheel.angleDelta.x);
                backend.activateByWheelDelta(delta);
            }
        }

        QtQuick.Row {
            id: pagerRow

            spacing: 0

            QtQuick.Repeater {
                model: backend

                delegate: DesktopButton {
                    horizontalPadding: fullRepresentationItem.horizontalPadding
                    labelFont: backend.labelFont
                    verticalPadding: fullRepresentationItem.verticalPadding

                    onActivated: desktopIndex => backend.activate(desktopIndex)
                }
            }
        }
    }
}
