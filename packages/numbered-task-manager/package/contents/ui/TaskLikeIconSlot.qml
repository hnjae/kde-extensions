// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts

QtQuick.Item {
    id: root

    default property alias badgeContent: badgeLayer.data
    property bool activeTask: false
    property bool highlighted: false
    property int iconExtent: 0
    property var fallback
    property var source

    QtQuickLayouts.Layout.alignment: QtQuick.Qt.AlignVCenter
    QtQuickLayouts.Layout.preferredHeight: root.iconExtent
    QtQuickLayouts.Layout.preferredWidth: root.iconExtent

    TaskLikeIcon {
        anchors.fill: parent
        activeTask: root.activeTask
        fallback: root.fallback
        highlighted: root.highlighted
        source: root.source
        z: 0
    }

    QtQuick.Item {
        id: badgeLayer

        anchors.fill: parent
        z: 1
    }
}
