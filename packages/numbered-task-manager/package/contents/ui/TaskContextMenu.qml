// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick.Controls as QtQuickControls

QtQuickControls.Menu {
    id: root

    property var task: ({})
    property var taskModel

    signal pinRequested(string launcherUrl)
    signal unpinRequested(string launcherUrl)

    function openForTask(taskData, item) {
        task = taskData || {};
        popup(item, 0, item.height);
    }

    QtQuickControls.MenuItem {
        enabled: root.task.launcherUrl && root.task.launcherUrl.length > 0
        text: root.task.hasLauncher ? "Unpin from Task Manager" : "Pin to Task Manager"

        onTriggered: {
            if (root.task.hasLauncher) {
                root.unpinRequested(root.task.launcherUrl);
            } else {
                root.pinRequested(root.task.launcherUrl);
            }
        }
    }

    QtQuickControls.MenuItem {
        enabled: root.taskModel && root.task.modelIndex
        text: "New Instance"
        visible: root.task.canLaunchNewInstance || root.task.isLauncher

        onTriggered: {
            root.taskModel.requestNewInstance(root.task.modelIndex);
        }
    }

    QtQuickControls.MenuSeparator {
        visible: closeItem.visible
    }

    QtQuickControls.MenuItem {
        id: closeItem

        enabled: root.taskModel && root.task.modelIndex
        text: "Close"
        visible: root.task.isWindow && root.task.closable

        onTriggered: {
            root.taskModel.requestClose(root.task.modelIndex);
        }
    }
}
