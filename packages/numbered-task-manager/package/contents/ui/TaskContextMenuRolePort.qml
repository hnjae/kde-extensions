// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQml as QtQml
import org.kde.taskmanager as TaskManager
import "TaskEntryLogic.mjs" as TaskEntryLogic

QtQml.QtObject {
    id: root

    readonly property var atm: TaskManager.AbstractTasksModel
    property var taskModel

    function hasTask(modelIndex) {
        return Boolean(taskModel) && TaskEntryLogic.hasValidModelIndex(modelIndex);
    }

    function data(modelIndex, role) {
        return taskModel.data(modelIndex, role);
    }

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
}
