// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.kirigami.platform as KirigamiPlatform

QtQuick.Item {
    id: root

    property int number: 0

    implicitWidth: Math.max(18, badgeText.implicitWidth + 8)
    implicitHeight: Math.max(18, badgeText.implicitHeight + 4)

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Selection

    QtQuick.Rectangle {
        anchors.fill: parent
        color: KirigamiPlatform.Theme.highlightColor
        radius: Math.min(width, height) / 2
    }

    QtQuick.Text {
        id: badgeText

        anchors.centerIn: parent
        color: KirigamiPlatform.Theme.highlightedTextColor
        font.family: KirigamiPlatform.Theme.fixedWidthFont.family
        font.bold: true
        font.pixelSize: 11
        horizontalAlignment: QtQuick.Text.AlignHCenter
        text: root.number > 0 ? root.number.toString() : ""
        verticalAlignment: QtQuick.Text.AlignVCenter
    }
}
