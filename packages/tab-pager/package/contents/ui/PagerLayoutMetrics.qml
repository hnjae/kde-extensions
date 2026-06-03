// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    required property bool verticalPanel

    readonly property int desktopGap: 1
    readonly property int horizontalPanelCrossAxisInset: 0
    readonly property int verticalPanelCrossAxisInset: 0
    readonly property int panelCrossAxisInset: verticalPanel ? verticalPanelCrossAxisInset : horizontalPanelCrossAxisInset
}
