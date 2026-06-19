// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActivationLogic.mjs" as TaskActivationLogic
import "VisibleTaskItemsLogic.mjs" as VisibleTaskItemsLogic

QtQuick.QtObject {
    id: root

    property var remoteAttentionSource
    property var taskActivationPort
    property var visibleTaskItems

    signal actionResult(var result)

    function activateTaskAtIndex(index) {
        const result = TaskActivationLogic.shortcutActivationRequest(visibleTaskItems, index);
        if (!result.ok) {
            root.actionResult(result);
            return result;
        }

        requestActivation(result);
        return result;
    }

    function activateTaskEntry(task) {
        const result = TaskActivationLogic.taskActivationRequest("activateTask", task, {
            requireSourceIndex: true,
            sourceModel: VisibleTaskItemsLogic.normalItemKind
        });
        if (!result.ok) {
            root.actionResult(result);
            return result;
        }

        requestActivation(result);
        return result;
    }

    function activateRemoteAttention(visibleItem) {
        const result = TaskActivationLogic.taskActivationRequest("activateRemoteAttention", visibleItem ? visibleItem.entry : null, {
            requireSourceIndex: false,
            sourceModel: visibleItem ? visibleItem.sourceModel : VisibleTaskItemsLogic.remoteAttentionItemKind,
            targetKind: visibleItem ? visibleItem.kind : VisibleTaskItemsLogic.remoteAttentionItemKind
        });
        if (!result.ok) {
            root.actionResult(result);
            return result;
        }

        requestActivation(result);
        return result;
    }

    function activationTarget(result) {
        if (result.sourceModel === VisibleTaskItemsLogic.remoteAttentionItemKind) {
            return remoteAttentionSource;
        }

        return taskActivationPort;
    }

    function requestActivation(result) {
        const target = activationTarget(result);
        let executionResult = TaskActivationLogic.activationExecutionResult(result, target);
        if (!executionResult.ok) {
            root.actionResult(executionResult);
            return executionResult;
        }

        try {
            target.requestActivate(result.modelIndex);
        } catch (error) {
            executionResult = TaskActivationLogic.activationExecutionResult(result, target, error);
            root.actionResult(executionResult);
            return executionResult;
        }

        return TaskActivationLogic.activationExecutionResult(result, target);
    }
}
