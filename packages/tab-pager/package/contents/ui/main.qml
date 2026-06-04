// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import QtQuick.Layouts as QtQuickLayouts
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid

import io.github.hnjae.tabpager as TabPager

PlasmoidItem {
    id: root

    readonly property bool verticalPanel: Plasmoid.formFactor === PlasmaCore.Types.Vertical
    readonly property int horizontalPadding: Math.max(6, Math.round(labelMetrics.averageCharacterWidth))
    readonly property int verticalPadding: Math.max(3, Math.round(labelMetrics.height / 4))

    implicitHeight: pagerDesktopStrip.implicitHeight
    implicitWidth: pagerDesktopStrip.implicitWidth

    Plasmoid.icon: "user-desktop"
    Plasmoid.constraintHints: layoutMetrics.useFillAreaConstraintHint ? Plasmoid.CanFillArea : Plasmoid.NoHint
    toolTipMainText: "Tab Pager"
    toolTipSubText: backend.count + " virtual desktops"

    QtQuickLayouts.Layout.fillHeight: layoutMetrics.fillHeight
    QtQuickLayouts.Layout.fillWidth: layoutMetrics.fillWidth
    QtQuickLayouts.Layout.maximumHeight: layoutMetrics.maximumHeight
    QtQuickLayouts.Layout.maximumWidth: layoutMetrics.maximumWidth
    QtQuickLayouts.Layout.minimumHeight: layoutMetrics.minimumHeight
    QtQuickLayouts.Layout.minimumWidth: layoutMetrics.minimumWidth
    QtQuickLayouts.Layout.preferredHeight: layoutMetrics.preferredHeight
    QtQuickLayouts.Layout.preferredWidth: layoutMetrics.preferredWidth

    clip: true

    TabPager.TabPagerBackend {
        id: backend
    }

    QtQuick.FontMetrics {
        id: labelMetrics

        font: backend.labelFont
    }

    PagerLayoutMetrics {
        id: layoutMetrics

        contentImplicitHeight: pagerDesktopStrip.implicitHeight
        contentImplicitWidth: pagerDesktopStrip.implicitWidth
        verticalPanel: root.verticalPanel
    }

    QtQuick.MouseArea {
        anchors.fill: parent
        acceptedButtons: QtQuick.Qt.NoButton

        onWheel: wheel => {
            const delta = (wheel.inverted ? -1 : 1) * (wheel.angleDelta.y || wheel.angleDelta.x);
            backend.activateByWheelDelta(delta);
        }
    }

    PagerDesktopStrip {
        id: pagerDesktopStrip

        anchors {
            fill: parent
            bottomMargin: layoutMetrics.bottomInset
            leftMargin: layoutMetrics.leftInset
            rightMargin: layoutMetrics.rightInset
            topMargin: layoutMetrics.topInset
        }

        desktopGap: layoutMetrics.desktopGap
        horizontalPadding: root.horizontalPadding
        model: backend
        verticalPanel: root.verticalPanel
        verticalPadding: root.verticalPadding
        labelFont: backend.labelFont

        onActivated: desktopIndex => backend.activate(desktopIndex)
    }
}
