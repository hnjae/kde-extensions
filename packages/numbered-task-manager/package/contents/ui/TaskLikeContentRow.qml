// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick.Layouts as QtQuickLayouts
import org.kde.kirigami as Kirigami

QtQuickLayouts.RowLayout {
    id: root

    property real contentOpacity: 1
    property var frame

    readonly property real frameBottomMargin: frame ? frame.contentBottomMargin : 0
    readonly property real frameLeftMargin: frame ? frame.contentLeftMargin : 0
    readonly property real frameRightMargin: frame ? frame.contentRightMargin : 0
    readonly property real frameTopMargin: frame ? frame.contentTopMargin : 0

    anchors.fill: parent
    anchors.bottomMargin: root.frameBottomMargin
    anchors.leftMargin: root.frameLeftMargin + Kirigami.Units.smallSpacing
    anchors.rightMargin: root.frameRightMargin + Kirigami.Units.smallSpacing
    anchors.topMargin: root.frameTopMargin
    opacity: root.contentOpacity
    spacing: Kirigami.Units.smallSpacing
}
