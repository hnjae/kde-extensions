// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskContextMenuLogic.js" as TaskContextMenuLogic

QtQuick.QtObject {
    id: root

    property var launcherActivityAdapter
    property var taskCommandAdapter

    signal launcherCommandRequested(var command)

    function triggerAction(actionState) {
        const route = TaskContextMenuLogic.contextMenuActionRoute(actionState);
        if (route.kind === "launcher-activity-update") {
            if (!launcherActivityAdapter) {
                return false;
            }

            return launcherActivityAdapter.applyLauncherActivityAction(route.update);
        }

        if (route.kind === "launcher-command") {
            launcherCommandRequested(route.command);
            return true;
        }

        if (route.kind === "task-model-request") {
            if (!taskCommandAdapter) {
                return false;
            }

            taskCommandAdapter.requestTaskModelCommand(route.command);
            return true;
        }

        return false;
    }
}
