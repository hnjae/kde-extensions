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
    readonly property int horizontalPadding: Math.max(6, Math.round(labelMetrics.averageCharacterWidth))
    readonly property int verticalPadding: Math.max(3, Math.round(labelMetrics.height / 4))

    implicitWidth: Math.max(pagerLayoutLoader.implicitWidth, 1)
    implicitHeight: Math.max(pagerLayoutLoader.implicitHeight, 1)

    Plasmoid.icon: "user-desktop"
    Plasmoid.constraintHints: root.verticalPanel ? Plasmoid.CanFillArea : Plasmoid.NoHint
    toolTipMainText: "Tab Pager"
    toolTipSubText: backend.count + " virtual desktops"

    QtQuickLayouts.Layout.fillHeight: !root.verticalPanel
    QtQuickLayouts.Layout.fillWidth: root.verticalPanel
    QtQuickLayouts.Layout.maximumHeight: root.verticalPanel ? root.implicitHeight : Infinity
    QtQuickLayouts.Layout.maximumWidth: root.verticalPanel ? Infinity : root.implicitWidth
    QtQuickLayouts.Layout.minimumHeight: root.verticalPanel ? root.implicitHeight : 1
    QtQuickLayouts.Layout.minimumWidth: root.verticalPanel ? 1 : root.implicitWidth
    QtQuickLayouts.Layout.preferredHeight: root.implicitHeight
    QtQuickLayouts.Layout.preferredWidth: root.implicitWidth

    clip: true

    TabPager.TabPagerBackend {
        id: backend
    }

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

        QtQuick.Item {
            id: horizontalLayout

            implicitHeight: horizontalMetricsButton.implicitHeight
            implicitWidth: horizontalRow.implicitWidth

            DesktopButton {
                id: horizontalMetricsButton

                active: false
                horizontalPadding: root.horizontalPadding
                index: -1
                label: ""
                labelFont: backend.labelFont
                verticalPadding: root.verticalPadding
                visible: false
            }

            QtQuick.Row {
                id: horizontalRow

                anchors.centerIn: parent
                height: parent.height > 0 ? parent.height : horizontalLayout.implicitHeight
                spacing: layoutMetrics.desktopGap
                width: implicitWidth

                QtQuick.Repeater {
                    model: backend

                    delegate: horizontalDesktopButtonComponent
                }
            }
        }
    }

    QtQuick.Component {
        id: verticalLayoutComponent

        QtQuickLayouts.ColumnLayout {
            spacing: layoutMetrics.desktopGap

            QtQuick.Repeater {
                model: backend

                delegate: verticalDesktopButtonComponent
            }
        }
    }

    QtQuick.Component {
        id: horizontalDesktopButtonComponent

        DesktopButton {
            height: horizontalRow.height
            width: implicitWidth

            horizontalPadding: root.horizontalPadding
            labelFont: backend.labelFont
            verticalPadding: root.verticalPadding

            onActivated: desktopIndex => backend.activate(desktopIndex)
        }
    }

    QtQuick.Component {
        id: verticalDesktopButtonComponent

        DesktopButton {
            QtQuickLayouts.Layout.fillWidth: true
            QtQuickLayouts.Layout.maximumHeight: implicitHeight
            QtQuickLayouts.Layout.maximumWidth: Infinity
            QtQuickLayouts.Layout.minimumHeight: implicitHeight
            QtQuickLayouts.Layout.minimumWidth: 1
            QtQuickLayouts.Layout.preferredHeight: implicitHeight
            QtQuickLayouts.Layout.preferredWidth: implicitWidth

            horizontalPadding: root.horizontalPadding
            labelFont: backend.labelFont
            verticalPadding: root.verticalPadding

            onActivated: desktopIndex => backend.activate(desktopIndex)
        }
    }
}
