// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.taskmanager as TaskManager
import "TaskContextMenuLogic.mjs" as TaskContextMenuLogic
import "TaskEntryLogic.mjs" as TaskEntryLogic

QtQuick.QtObject {
    id: root

    readonly property var atm: TaskManager.AbstractTasksModel
    readonly property bool hasTask: Boolean(taskModel) && TaskEntryLogic.hasValidModelIndex(modelIndex)
    readonly property bool hasWindowTask: hasTask && taskRoles.isWindow
    readonly property var snapshots: TaskContextMenuLogic.contextMenuRoleSnapshots(roleSource(), roleIds(), task)
    readonly property var taskRoles: snapshots.taskRoles
    property var modelIndex
    property var task: ({})
    property var taskModel

    function roleIds() {
        return {
            Activities: atm.Activities,
            CanSetNoBorder: atm.CanSetNoBorder,
            CanLaunchNewInstance: atm.CanLaunchNewInstance,
            HasNoBorder: atm.HasNoBorder,
            IsClosable: atm.IsClosable,
            IsExcludedFromCapture: atm.IsExcludedFromCapture,
            IsFullScreen: atm.IsFullScreen,
            IsFullScreenable: atm.IsFullScreenable,
            IsKeepAbove: atm.IsKeepAbove,
            IsKeepBelow: atm.IsKeepBelow,
            IsLauncher: atm.IsLauncher,
            IsMaximizable: atm.IsMaximizable,
            IsMaximized: atm.IsMaximized,
            IsMinimizable: atm.IsMinimizable,
            IsMinimized: atm.IsMinimized,
            IsMovable: atm.IsMovable,
            IsOnAllVirtualDesktops: atm.IsOnAllVirtualDesktops,
            IsResizable: atm.IsResizable,
            IsShadeable: atm.IsShadeable,
            IsShaded: atm.IsShaded,
            IsVirtualDesktopsChangeable: atm.IsVirtualDesktopsChangeable,
            IsWindow: atm.IsWindow,
            LauncherUrl: atm.LauncherUrl,
            LauncherUrlWithoutIcon: atm.LauncherUrlWithoutIcon,
            VirtualDesktops: atm.VirtualDesktops
        };
    }

    function roleSource() {
        return {
            hasTask: hasTask,
            modelIndex: modelIndex,
            taskModel: taskModel
        };
    }
}
