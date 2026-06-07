// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import org.kde.ksvg as KSvg
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import "TaskVisualLogic.js" as TaskVisualLogic

KSvg.FrameSvgItem {
    id: root

    property bool active: false
    property bool attention: false
    property bool dropHover: false
    property bool hovered: false
    property bool launcher: false
    property bool minimized: false
    property bool mutedLauncher: false
    property int panelLocation: Plasmoid.location
    readonly property real contentBottomMargin: margins.bottom
    readonly property real contentLeftMargin: margins.left
    readonly property real contentRightMargin: margins.right
    readonly property real contentTopMargin: margins.top

    imagePath: "widgets/tasks"
    opacity: TaskVisualLogic.frameOpacity({
        active: root.active,
        attention: root.attention,
        dropHover: root.dropHover,
        hovered: root.hovered,
        mutedLauncher: root.mutedLauncher
    })
    prefix: TaskVisualLogic.framePrefixes({
        active: root.active,
        attention: root.attention,
        dropHover: root.dropHover,
        hovered: root.hovered,
        launcher: root.launcher,
        minimized: root.minimized,
        mutedLauncher: root.mutedLauncher
    }, root.panelLocation, PlasmaCore.Types)
}
