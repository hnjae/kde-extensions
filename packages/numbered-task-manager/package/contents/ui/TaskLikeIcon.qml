// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.kirigami.primitives as KirigamiPrimitives
import "TaskVisualLogic.mjs" as TaskVisualLogic

QtQuick.Item {
    id: root

    property bool activeTask: false
    property bool highlighted: false
    property var fallback
    property var source

    KirigamiPrimitives.Icon {
        anchors.fill: parent
        active: TaskVisualLogic.iconActive({
            active: root.activeTask,
            highlighted: root.highlighted
        })
        fallback: root.fallback
        source: root.source
    }
}
