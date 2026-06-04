// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    required property bool verticalPanel
    property real contentImplicitHeight: 1
    property real contentImplicitWidth: 1

    readonly property int desktopGap: 1
    readonly property bool fillHeight: !verticalPanel
    readonly property bool fillWidth: verticalPanel
    readonly property int horizontalPanelCrossAxisInset: 0
    readonly property int panelCrossAxisInset: verticalPanel ? verticalPanelCrossAxisInset : horizontalPanelCrossAxisInset
    readonly property int verticalPanelCrossAxisInset: 0

    readonly property real boundedContentImplicitHeight: Math.max(contentImplicitHeight, 1)
    readonly property real boundedContentImplicitWidth: Math.max(contentImplicitWidth, 1)
    readonly property real maximumHeight: verticalPanel ? boundedContentImplicitHeight : Infinity
    readonly property real maximumWidth: verticalPanel ? Infinity : boundedContentImplicitWidth
    readonly property real minimumHeight: verticalPanel ? boundedContentImplicitHeight : 1
    readonly property real minimumWidth: verticalPanel ? 1 : boundedContentImplicitWidth
    readonly property real preferredHeight: verticalPanel ? boundedContentImplicitHeight : -1
    readonly property real preferredWidth: verticalPanel ? -1 : boundedContentImplicitWidth

    readonly property int bottomInset: verticalPanel ? 0 : panelCrossAxisInset
    readonly property int leftInset: verticalPanel ? panelCrossAxisInset : 0
    readonly property int rightInset: verticalPanel ? panelCrossAxisInset : 0
    readonly property int topInset: verticalPanel ? 0 : panelCrossAxisInset
    readonly property bool useFillAreaConstraintHint: verticalPanel
}
