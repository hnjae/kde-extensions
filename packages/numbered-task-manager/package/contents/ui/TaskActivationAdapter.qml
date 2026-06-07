// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.js" as TaskActionLogic

QtQuick.QtObject {
    id: root

    property var remoteAttentionSource
    property var taskModel
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
            sourceModel: "normal"
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
            sourceModel: visibleItem ? visibleItem.sourceModel : "remoteAttention",
            targetKind: visibleItem ? visibleItem.kind : "remoteAttention"
        });
        if (!result.ok) {
            root.actionResult(result);
            return result;
        }

        requestActivation(result);
        return result;
    }

    function requestActivation(result) {
        if (result.sourceModel === "remoteAttention") {
            remoteAttentionSource.requestActivate(result.modelIndex);
            return;
        }

        taskModel.requestActivate(result.modelIndex);
    }
}
