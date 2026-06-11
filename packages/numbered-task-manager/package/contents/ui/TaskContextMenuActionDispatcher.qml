// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic
import "TaskContextMenuLogic.mjs" as TaskContextMenuLogic

QtQuick.QtObject {
    id: root

    property var launcherActivityAdapter
    property var taskCommandAdapter

    signal actionResult(var result)
    signal launcherCommandRequested(var command)

    function dispatchFailure(route, code) {
        const result = TaskActionLogic.contextMenuActionDispatchFailure(route, code);
        actionResult(result);
        return false;
    }

    function triggerAction(actionState) {
        const route = TaskContextMenuLogic.contextMenuActionRoute(actionState);
        if (route.kind === "launcher-activity-update") {
            if (!launcherActivityAdapter) {
                return dispatchFailure(route, "missing-launcher-activity-adapter");
            }

            return launcherActivityAdapter.applyLauncherActivityAction(route.update);
        }

        if (route.kind === "launcher-command") {
            launcherCommandRequested(route.command);
            return true;
        }

        if (route.kind === "task-model-request") {
            if (!taskCommandAdapter) {
                return dispatchFailure(route, "missing-task-command-adapter");
            }

            taskCommandAdapter.requestTaskModelCommand(route.command);
            return true;
        }

        return dispatchFailure(route, "unknown-route");
    }
}
