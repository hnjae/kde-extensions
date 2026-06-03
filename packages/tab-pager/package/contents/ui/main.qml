// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid

import io.github.hnjae.tabpager as TabPager

PlasmoidItem {
    id: root

    readonly property bool verticalPanel: Plasmoid.formFactor === PlasmaCore.Types.Vertical

    Plasmoid.icon: "user-desktop"
    preferredRepresentation: root.fullRepresentation
    toolTipMainText: "Tab Pager"
    toolTipSubText: backend.count + " virtual desktops"

    QtQuickLayouts.Layout.fillHeight: !root.verticalPanel
    QtQuickLayouts.Layout.fillWidth: root.verticalPanel
    QtQuickLayouts.Layout.maximumHeight: root.verticalPanel ? fullRepresentationItem.implicitHeight : Infinity
    QtQuickLayouts.Layout.maximumWidth: root.verticalPanel ? Infinity : fullRepresentationItem.implicitWidth
    QtQuickLayouts.Layout.minimumHeight: root.verticalPanel ? fullRepresentationItem.implicitHeight : 1
    QtQuickLayouts.Layout.minimumWidth: root.verticalPanel ? 1 : fullRepresentationItem.implicitWidth
    QtQuickLayouts.Layout.preferredHeight: fullRepresentationItem.implicitHeight
    QtQuickLayouts.Layout.preferredWidth: fullRepresentationItem.implicitWidth

    TabPager.TabPagerBackend {
        id: backend
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        readonly property int horizontalPadding: Math.max(6, Math.round(labelMetrics.averageCharacterWidth))
        readonly property int verticalPadding: Math.max(3, Math.round(labelMetrics.height / 4))

        implicitWidth: Math.max(pagerLayoutLoader.implicitWidth, 1)
        implicitHeight: Math.max(pagerLayoutLoader.implicitHeight, 1)

        QtQuickLayouts.Layout.fillHeight: !root.verticalPanel
        QtQuickLayouts.Layout.fillWidth: root.verticalPanel
        QtQuickLayouts.Layout.maximumHeight: root.verticalPanel ? implicitHeight : Infinity
        QtQuickLayouts.Layout.maximumWidth: root.verticalPanel ? Infinity : implicitWidth
        QtQuickLayouts.Layout.minimumHeight: root.verticalPanel ? implicitHeight : 1
        QtQuickLayouts.Layout.minimumWidth: root.verticalPanel ? 1 : implicitWidth
        QtQuickLayouts.Layout.preferredHeight: implicitHeight
        QtQuickLayouts.Layout.preferredWidth: implicitWidth

        clip: true

        QtQuick.FontMetrics {
            id: labelMetrics

            font: backend.labelFont
        }

        PagerLayoutMetrics {
            id: layoutMetrics

            verticalPanel: root.verticalPanel
        }

        QtQuick.MouseArea {
            anchors.fill: parent
            acceptedButtons: QtQuick.Qt.NoButton

            onWheel: wheel => {
                const delta = (wheel.inverted ? -1 : 1) * (wheel.angleDelta.y || wheel.angleDelta.x);
                backend.activateByWheelDelta(delta);
            }
        }

        QtQuick.Loader {
            id: pagerLayoutLoader

            anchors {
                fill: parent
                bottomMargin: root.verticalPanel ? 0 : layoutMetrics.panelCrossAxisInset
                leftMargin: root.verticalPanel ? layoutMetrics.panelCrossAxisInset : 0
                rightMargin: root.verticalPanel ? layoutMetrics.panelCrossAxisInset : 0
                topMargin: root.verticalPanel ? 0 : layoutMetrics.panelCrossAxisInset
            }
            sourceComponent: root.verticalPanel ? verticalLayoutComponent : horizontalLayoutComponent
        }

        QtQuick.Component {
            id: horizontalLayoutComponent

            QtQuickLayouts.RowLayout {
                spacing: layoutMetrics.desktopGap

                QtQuick.Repeater {
                    model: backend

                    delegate: desktopButtonComponent
                }
            }
        }

        QtQuick.Component {
            id: verticalLayoutComponent

            QtQuickLayouts.ColumnLayout {
                spacing: layoutMetrics.desktopGap

                QtQuick.Repeater {
                    model: backend

                    delegate: desktopButtonComponent
                }
            }
        }

        QtQuick.Component {
            id: desktopButtonComponent

            DesktopButton {
                QtQuickLayouts.Layout.fillHeight: !root.verticalPanel
                QtQuickLayouts.Layout.fillWidth: root.verticalPanel
                QtQuickLayouts.Layout.maximumHeight: root.verticalPanel ? implicitHeight : Infinity
                QtQuickLayouts.Layout.maximumWidth: root.verticalPanel ? Infinity : implicitWidth
                QtQuickLayouts.Layout.minimumHeight: root.verticalPanel ? implicitHeight : 1
                QtQuickLayouts.Layout.minimumWidth: root.verticalPanel ? 1 : implicitWidth
                QtQuickLayouts.Layout.preferredHeight: implicitHeight
                QtQuickLayouts.Layout.preferredWidth: implicitWidth

                horizontalPadding: fullRepresentationItem.horizontalPadding
                labelFont: backend.labelFont
                verticalPadding: fullRepresentationItem.verticalPadding

                onActivated: desktopIndex => backend.activate(desktopIndex)
            }
        }
    }
}
