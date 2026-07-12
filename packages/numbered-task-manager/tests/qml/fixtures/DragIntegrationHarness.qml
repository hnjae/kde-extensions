// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import "../../../package/contents/ui" as NumberedTaskManager

Item {
    id: root

    property bool acceptDrops: true
    property bool accepted: false
    property int droppedSource: -1
    property int droppedTarget: -1

    width: 400
    height: 200

    NumberedTaskManager.TaskItem {
        id: source
        objectName: "dragSource"
        x: 20
        y: 20
        width: 120
        height: 48
        dragMimeType: "application/x-numbered-task"
        taskIndex: 1
    }

    NumberedTaskManager.TaskItem {
        id: target
        objectName: "dragTarget"
        x: 220
        y: 20
        width: 120
        height: 48
        canDropTask: () => root.acceptDrops
        dragMimeType: "application/x-numbered-task"
        taskIndex: 2

        onTaskDropped: (sourceIndex, targetIndex, drop) => {
            root.droppedSource = sourceIndex;
            root.droppedTarget = targetIndex;
            drop.acceptProposedAction();
            root.accepted = true;
        }
    }
}
