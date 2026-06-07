// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.js" as TaskActionLogic

QtQuick.Item {
    id: root

    property var launcherModel

    signal actionResult(var result)
    signal launcherCommandRequested(var command)

    height: 0
    visible: false
    width: 0

    function openTaskContextMenu(request) {
        const menuRequest = TaskActionLogic.contextMenuRequestResult(request);
        if (!menuRequest.ok) {
            actionResult(menuRequest);
            return;
        }

        const visualParent = menuRequest.visualParent;
        const menu = contextMenuComponent.createObject(visualParent, {
            launcherModel: root.launcherModel,
            modelIndex: menuRequest.modelIndex,
            task: menuRequest.task || {},
            taskModel: menuRequest.taskModel,
            visualParent: visualParent,
            visualParentWidth: menuRequest.visualParentWidth
        }) as TaskContextMenu;
        const creationResult = TaskActionLogic.contextMenuCreationResult(menu, menuRequest);
        if (!creationResult.ok) {
            actionResult(creationResult);
            return;
        }

        if (visualParent.contextMenuOpen !== undefined) {
            visualParent.contextMenuOpen = true;
            menu.closed.connect(() => {
                if (visualParent.contextMenuOpen !== undefined) {
                    visualParent.contextMenuOpen = false;
                }
            });
        }

        menu.actionResult.connect(result => root.actionResult(result));
        menu.launcherCommandRequested.connect(command => root.launcherCommandRequested(command));
        menu.show();
    }

    QtQuick.Component {
        id: contextMenuComponent

        TaskContextMenu {}
    }
}
