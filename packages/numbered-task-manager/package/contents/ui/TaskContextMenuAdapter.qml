// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskContextMenuRequestLogic.mjs" as TaskContextMenuRequestLogic

QtQuick.Item {
    id: root

    property var launcherReadPort
    property var taskCommandPort
    property var taskRolePort

    signal actionResult(var result)
    signal launcherCommandRequested(var command)

    height: 0
    visible: false
    width: 0

    function contextMenuRequest(request) {
        return Object.assign({
            taskRolePort: root.taskRolePort
        }, request || ({}));
    }

    function notifyContextMenuOpened(menuRequest) {
        if (typeof menuRequest.onContextMenuOpened === "function") {
            menuRequest.onContextMenuOpened();
        }
    }

    function notifyContextMenuClosed(menuRequest) {
        if (typeof menuRequest.onContextMenuClosed === "function") {
            menuRequest.onContextMenuClosed();
        }
    }

    function openTaskContextMenu(request) {
        const menuRequest = TaskContextMenuRequestLogic.contextMenuRequestResult(contextMenuRequest(request));
        if (!menuRequest.ok) {
            actionResult(menuRequest);
            return;
        }

        const visualParent = menuRequest.visualParent;
        const menu = contextMenuComponent.createObject(visualParent, {
            launcherReadPort: root.launcherReadPort,
            modelIndex: menuRequest.modelIndex,
            task: menuRequest.task || {},
            taskCommandPort: root.taskCommandPort,
            taskRolePort: menuRequest.taskRolePort,
            visualParent: visualParent,
            visualParentWidth: menuRequest.visualParentWidth
        }) as TaskContextMenu;
        const creationResult = TaskContextMenuRequestLogic.contextMenuCreationResult(menu, menuRequest);
        if (!creationResult.ok) {
            actionResult(creationResult);
            return;
        }

        notifyContextMenuOpened(menuRequest);
        menu.closed.connect(() => root.notifyContextMenuClosed(menuRequest));

        menu.actionResult.connect(result => root.actionResult(result));
        menu.launcherCommandRequested.connect(command => root.launcherCommandRequested(command));
        menu.show();
    }

    QtQuick.Component {
        id: contextMenuComponent

        TaskContextMenu {}
    }
}
