// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskContextMenuTaskCommandLogic.mjs" as TaskContextMenuTaskCommandLogic

QtQuick.QtObject {
    id: root

    property var modelIndex
    property var task: ({})
    property var taskCommandPort

    signal actionResult(var result)

    function requestTaskModelCommand(command) {
        const result = TaskContextMenuTaskCommandLogic.contextMenuTaskRequest(command, taskCommandPort, modelIndex, task);
        if (!result.ok) {
            actionResult(result);
            return result;
        }

        const executionResult = TaskContextMenuTaskCommandLogic.executeContextMenuTaskRequest(result, taskCommandPort);
        if (!executionResult.ok) {
            actionResult(executionResult);
        }

        return executionResult;
    }
}
