// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic
import "VisibleTaskItemsLogic.mjs" as VisibleTaskItemsLogic

QtQuick.QtObject {
    id: root

    property var remoteAttentionSource
    property var taskActivationPort
    property var visibleTaskItems

    signal actionResult(var result)

    function activateTaskAtIndex(index) {
        const result = TaskActionLogic.shortcutActivationRequest(visibleTaskItems, index);
        if (!result.ok) {
            root.actionResult(result);
            return result;
        }

        requestActivation(result);
        return result;
    }

    function activateTaskEntry(task) {
        const result = TaskActionLogic.taskActivationRequest("activateTask", task, {
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
        const result = TaskActionLogic.taskActivationRequest("activateRemoteAttention", visibleItem ? visibleItem.entry : null, {
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
        let executionResult = TaskActionLogic.activationExecutionResult(result, target);
        if (!executionResult.ok) {
            root.actionResult(executionResult);
            return executionResult;
        }

        try {
            target.requestActivate(result.modelIndex);
        } catch (error) {
            executionResult = TaskActionLogic.activationExecutionResult(result, target, error);
            root.actionResult(executionResult);
            return executionResult;
        }

        return TaskActionLogic.activationExecutionResult(result, target);
    }
}
