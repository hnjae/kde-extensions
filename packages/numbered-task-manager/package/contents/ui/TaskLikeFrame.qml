// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.Item {
    id: root

    property bool active: false
    property bool attention: false
    property bool dropHover: false
    property bool hovered: false
    property bool launcher: false
    property bool minimized: false
    property bool mutedLauncher: false
    readonly property real contentBottomMargin: taskFrame.contentBottomMargin
    readonly property real contentLeftMargin: taskFrame.contentLeftMargin
    readonly property real contentRightMargin: taskFrame.contentRightMargin
    readonly property real contentTopMargin: taskFrame.contentTopMargin

    TaskFrame {
        id: taskFrame

        anchors.fill: parent
        active: root.active
        attention: root.attention
        dropHover: root.dropHover
        hovered: root.hovered
        launcher: root.launcher
        minimized: root.minimized
        mutedLauncher: root.mutedLauncher
    }
}
