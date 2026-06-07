// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts

QtQuick.Item {
    id: root

    property bool fill: false

    visible: root.fill

    QtQuickLayouts.Layout.fillWidth: root.fill
}
