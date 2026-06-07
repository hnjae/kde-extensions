// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.js" as TaskActionLogic

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

        try {
            if (result.requestArguments.length === 0) {
                taskModel[result.requestMethod](modelIndex);
            } else {
                taskModel[result.requestMethod](modelIndex, result.requestArguments[0]);
            }
        } catch (error) {
            const executionResult = TaskActionLogic.contextMenuTaskExecutionResult(result, error);
            actionResult(executionResult);
            return executionResult;
        }

        return TaskActionLogic.contextMenuTaskExecutionResult(result);
    }
}
