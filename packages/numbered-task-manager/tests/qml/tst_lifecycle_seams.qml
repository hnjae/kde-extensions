// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "LifecycleSeams"

    QtObject {
        id: fakeTaskModel
        function makePersistentModelIndex(index) {
            return index;
        }
        function requestActivate(index) {
        }
    }

    Component {
        id: fakeMenuComponent
        Item {
            property var desktopActionBackend
            property var launcherReadPort
            property var modelIndex
            property var task
            property var taskCommandPort
            property var taskRolePort
            property var visualParent
            property real visualParentWidth
            signal actionResult(var result)
            signal launcherCommandRequested(var command)
            signal closed
            function show() {
                Qt.callLater(() => {
                    closed();
                    destroy();
                });
            }
        }
    }

    NumberedTaskManager.RemoteAttentionSource {
        id: attentionSource
        taskModel: fakeTaskModel
    }

    NumberedTaskManager.TaskContextMenuAdapter {
        id: menuAdapter
        menuComponent: fakeMenuComponent
        taskRolePort: fakeTaskModel
    }

    SignalSpy {
        id: closedSpy
        target: menuAdapter
        signalName: "actionResult"
    }

    function test_remote_source_uses_injected_model() {
        compare(attentionSource.taskModel, fakeTaskModel);
        attentionSource.requestActivate(7);
    }

    function test_menu_lifetime_callbacks_survive_factory_boundary() {
        const originalChildCount = menuAdapter.children.length;
        let opened = 0;
        let closed = 0;
        menuAdapter.openTaskContextMenu({
            modelIndex: {
                valid: true
            },
            onContextMenuOpened: () => ++opened,
            onContextMenuClosed: () => ++closed,
            task: {},
            visualParent: menuAdapter,
            visualParentWidth: 100
        });
        compare(opened, 1);
        tryVerify(() => closed === 1);
        tryVerify(() => menuAdapter.children.length === originalChildCount);
    }
}
