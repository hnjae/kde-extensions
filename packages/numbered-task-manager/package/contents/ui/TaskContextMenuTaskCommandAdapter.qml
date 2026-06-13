// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic

QtQuick.QtObject {
    id: root

    property var modelIndex
    property var task: ({})
    property var taskModel

    signal actionResult(var result)

    function requestTaskModelCommand(command) {
        const result = TaskActionLogic.contextMenuTaskRequest(command, taskModel, modelIndex, task);
        if (!result.ok) {
            actionResult(result);
            return result;
        }

        const executionResult = TaskActionLogic.executeContextMenuTaskRequest(result, taskModel);
        if (!executionResult.ok) {
            actionResult(executionResult);
        }

        return executionResult;
    }
}
