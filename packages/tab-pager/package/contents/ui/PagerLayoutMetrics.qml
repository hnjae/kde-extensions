// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

import "PagerLayoutMetricsLogic.js" as PagerLayoutMetricsLogic

QtQuick.QtObject {
    required property bool verticalPanel
    property real contentImplicitHeight: 1
    property real contentImplicitWidth: 1

    readonly property var calculatedMetrics: PagerLayoutMetricsLogic.calculateLayoutMetrics(verticalPanel, contentImplicitWidth, contentImplicitHeight)

    readonly property int desktopGap: calculatedMetrics.desktopGap
    readonly property bool fillHeight: calculatedMetrics.fillHeight
    readonly property real fillMinimumExtent: calculatedMetrics.fillMinimumExtent
    readonly property bool fillWidth: calculatedMetrics.fillWidth
    readonly property int horizontalPanelCrossAxisInset: calculatedMetrics.horizontalPanelCrossAxisInset
    readonly property int panelCrossAxisInset: calculatedMetrics.panelCrossAxisInset
    readonly property int verticalPanelCrossAxisInset: calculatedMetrics.verticalPanelCrossAxisInset

    readonly property real boundedContentImplicitHeight: calculatedMetrics.boundedContentImplicitHeight
    readonly property real boundedContentImplicitWidth: calculatedMetrics.boundedContentImplicitWidth
    readonly property real maximumHeight: calculatedMetrics.maximumHeight
    readonly property real maximumWidth: calculatedMetrics.maximumWidth
    readonly property real minimumHeight: calculatedMetrics.minimumHeight
    readonly property real minimumWidth: calculatedMetrics.minimumWidth
    readonly property real preferredHeight: calculatedMetrics.preferredHeight
    readonly property real preferredWidth: calculatedMetrics.preferredWidth
    readonly property real unsetPreferredExtent: calculatedMetrics.unsetPreferredExtent

    readonly property int bottomInset: calculatedMetrics.bottomInset
    readonly property int leftInset: calculatedMetrics.leftInset
    readonly property int rightInset: calculatedMetrics.rightInset
    readonly property int topInset: calculatedMetrics.topInset
    readonly property bool useFillAreaConstraintHint: calculatedMetrics.useFillAreaConstraintHint
}
