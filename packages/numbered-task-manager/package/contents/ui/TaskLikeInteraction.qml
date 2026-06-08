// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.kirigami.platform as KirigamiPlatform
import "TaskInteractionLogic.js" as TaskInteractionLogic

QtQuick.Item {
    id: root

    property bool contextMenuOpen: false
    property var focusTarget: root
    property var modelIndex
    property var taskData: ({})
    property var visualParent: root.focusTarget
    readonly property bool highlighted: pointerHandler.hovered || root.activeFocus || root.focusTarget.activeFocus || root.contextMenuOpen

    signal activated
    signal contextMenuRequested(var request)

    anchors.fill: parent
    activeFocusOnTab: true

    KirigamiPlatform.Theme.colorSet: KirigamiPlatform.Theme.Button

    QtQuick.Keys.onMenuPressed: contextMenuTimer.start()

    QtQuick.HoverHandler {
        id: pointerHandler
    }

    QtQuick.TapHandler {
        acceptedButtons: QtQuick.Qt.RightButton
        acceptedDevices: QtQuick.PointerDevice.Mouse | QtQuick.PointerDevice.TouchPad | QtQuick.PointerDevice.Stylus
        gesturePolicy: QtQuick.TapHandler.WithinBounds

        onPressedChanged: {
            if (pressed) {
                contextMenuTimer.start();
            }
        }
    }

    QtQuick.TapHandler {
        acceptedButtons: QtQuick.Qt.LeftButton

        onTapped: {
            root.activated();
        }
    }

    QtQuick.Timer {
        id: contextMenuTimer

        interval: 0

        onTriggered: {
            root.focusTarget.forceActiveFocus(QtQuick.Qt.MouseFocusReason);
            root.contextMenuRequested(TaskInteractionLogic.taskContextMenuRequest(root.modelIndex, root.taskData, root.visualParent));
        }
    }
}
