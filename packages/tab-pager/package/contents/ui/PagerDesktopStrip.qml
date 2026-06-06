// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts

QtQuick.Item {
    id: root

    required property bool verticalPanel
    property int desktopGap: 1
    property int horizontalPadding: 0
    property var labelFont
    property var model
    property int verticalPadding: 0

    signal activated(int desktopIndex)

    implicitHeight: Math.max(layoutLoader.implicitHeight, 1)
    implicitWidth: Math.max(layoutLoader.implicitWidth, 1)

    QtQuick.Loader {
        id: layoutLoader

        anchors.fill: parent
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
                labelFont: root.labelFont
                verticalPadding: root.verticalPadding
                visible: false
            }

            QtQuick.Row {
                id: horizontalRow

                anchors.centerIn: parent
                height: parent.height > 0 ? parent.height : horizontalLayout.implicitHeight
                spacing: root.desktopGap
                width: implicitWidth

                QtQuick.Repeater {
                    model: root.model

                    delegate: DesktopButton {
                        height: horizontalRow.height
                        width: implicitWidth

                        horizontalPadding: root.horizontalPadding
                        labelFont: root.labelFont
                        verticalPadding: root.verticalPadding

                        onActivated: desktopIndex => root.activated(desktopIndex)
                    }
                }
            }
        }
    }

    QtQuick.Component {
        id: verticalLayoutComponent

        QtQuickLayouts.ColumnLayout {
            spacing: root.desktopGap

            QtQuick.Repeater {
                model: root.model

                delegate: verticalDesktopButtonComponent
            }
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
            labelFont: root.labelFont
            verticalPadding: root.verticalPadding

            onActivated: desktopIndex => root.activated(desktopIndex)
        }
    }
}
