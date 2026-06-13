// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic
import "TaskContextMenuRouteLogic.mjs" as TaskContextMenuRouteLogic

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
        const route = TaskContextMenuRouteLogic.contextMenuActionRoute(actionState);
        if (TaskContextMenuRouteLogic.isUnavailableRoute(route)) {
            return dispatchFailure(route, route.code);
        }

        if (TaskContextMenuRouteLogic.isLauncherActivityUpdateRoute(route)) {
            if (!launcherActivityAdapter) {
                return dispatchFailure(route, "missing-launcher-activity-adapter");
            }

            return launcherActivityAdapter.applyLauncherActivityAction(route.update);
        }

        if (TaskContextMenuRouteLogic.isLauncherCommandRoute(route)) {
            launcherCommandRequested(route.command);
            return true;
        }

        if (TaskContextMenuRouteLogic.isTaskModelRequestRoute(route)) {
            if (!taskCommandAdapter) {
                return dispatchFailure(route, "missing-task-command-adapter");
            }

            taskCommandAdapter.requestTaskModelCommand(route.command);
            return true;
        }

        return dispatchFailure(route, "unknown-route");
    }
}
