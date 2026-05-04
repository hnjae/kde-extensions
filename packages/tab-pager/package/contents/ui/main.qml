// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import org.kde.plasma.components as PlasmaComponents
import org.kde.plasma.plasmoid

import "generated/logic.js" as Logic

PlasmoidItem {
    id: root

    Plasmoid.icon: "applications-development"
    preferredRepresentation: fullRepresentation
    toolTipMainText: "Sample"
    toolTipSubText: Logic.greetingFor("Plasma")

    fullRepresentation: Item {
        implicitWidth: 240
        implicitHeight: 96

        PlasmaComponents.Label {
            anchors.centerIn: parent
            horizontalAlignment: Text.AlignHCenter
            text: Logic.greetingFor("Plasma")
            verticalAlignment: Text.AlignVCenter
        }
    }
}
