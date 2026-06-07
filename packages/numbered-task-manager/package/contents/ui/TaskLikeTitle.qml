// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami.platform as KirigamiPlatform

QtQuick.Text {
    id: root

    property bool strikeout: false
    property string title: ""

    QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
    QtQuickLayouts.Layout.fillWidth: root.visible
    color: KirigamiPlatform.Theme.textColor
    elide: QtQuick.Text.ElideRight
    font.strikeout: root.strikeout
    maximumLineCount: 1
    text: root.title
    verticalAlignment: QtQuick.Text.AlignVCenter
}
