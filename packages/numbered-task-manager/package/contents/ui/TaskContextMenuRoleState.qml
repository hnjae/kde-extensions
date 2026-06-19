// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQml as QtQml
import "TaskContextMenuRoleLogic.mjs" as TaskContextMenuRoleLogic

QtQml.QtObject {
    id: root

    readonly property bool hasTask: taskRolePort ? taskRolePort.hasTask(modelIndex) : false
    readonly property bool hasWindowTask: hasTask && taskRoles.isWindow
    readonly property var snapshots: TaskContextMenuRoleLogic.contextMenuRoleSnapshots(roleSource(), roleIds(), task)
    readonly property var taskRoles: snapshots.taskRoles
    property var modelIndex
    property var task: ({})
    property var taskRolePort

    function roleIds() {
        return taskRolePort ? taskRolePort.roleIds() : {};
    }

    function roleSource() {
        return {
            hasTask: hasTask,
            modelIndex: modelIndex,
            rolePort: taskRolePort
        };
    }
}
