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
    toolTipSubText: backend.greeting

    TabPager.TabPagerBackend {
        id: backend
    }

    fullRepresentation: QtQuick.Item {
        id: fullRepresentationItem

        implicitWidth: 240
        implicitHeight: 96

        PlasmaComponents.Label {
            anchors.centerIn: fullRepresentationItem
            horizontalAlignment: QtQuick.Text.AlignHCenter
            text: backend.greeting
            verticalAlignment: QtQuick.Text.AlignVCenter
        }
    }
}
