// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "TaskItems"
    when: windowShown
    width: 400
    height: 200

    QtObject {
        id: activationAdapter
        property var entry
        function activateTaskEntry(value) {
            entry = value;
        }
    }
    QtObject {
        id: contextMenuAdapter
        property var request
        function openTaskContextMenu(value) {
            request = value;
        }
    }
    QtObject {
        id: moveAdapter
        property var move: []
        property bool accepted: true
        function canMoveTaskResult(source, target) {
            return {
                canMove: accepted
            };
        }
        function moveTask(source, target) {
            move = [source, target];
            return accepted;
        }
    }
    QtObject {
        id: remoteSource
        property int itemCount: 2
        property var itemIconSource: ""
        property var itemModelIndex: ({
                valid: true
            })
        property var itemTaskData: ({
                title: "Attention"
            })
        property string itemTitle: "Attention"
        property bool itemVisible: true
        property int activations: 0
        property var request
        function requestVisibleActivation() {
            ++activations;
        }
        function requestVisibleContextMenu(value) {
            request = value;
        }
    }
    QtObject {
        id: drop
        property int accepts: 0
        function acceptProposedAction() {
            ++accepts;
        }
        function getDataAsString(mimeType) {
            return "1";
        }
    }

    NumberedTaskManager.NormalTaskItem {
        id: normalItem
        width: 160
        height: 40
        activationAdapter: activationAdapter
        contextMenuAdapter: contextMenuAdapter
        moveAdapter: moveAdapter
        taskDragMimeType: "application/x-numbered-task"
        taskListHeight: 40
        taskListWidth: 160
        taskSlotWidth: 160
        visibleItem: ({
                slotNumber: 1,
                entry: {
                    entryKey: "task",
                    isLauncher: false,
                    launcherBacked: false,
                    modelIndex: {
                        valid: true
                    },
                    sourceIndex: 3,
                    title: "Task"
                }
            })
    }
    NumberedTaskManager.RemoteAttentionItem {
        id: remoteItem
        source: remoteSource
        taskSlotWidth: 160
    }
    NumberedTaskManager.TaskListRepresentation {
        id: representation
        width: 320
        height: 40
        activationAdapter: activationAdapter
        contextMenuAdapter: contextMenuAdapter
        moveAdapter: moveAdapter
        normalVisibleTaskItems: [normalItem.visibleItem]
        remoteAttentionSource: remoteSource
        visibleTaskItems: [normalItem.visibleItem,
            {
                kind: "remoteAttention"
            }
        ]
    }
    NumberedTaskManager.TaskItem {
        id: dragTarget
        width: 100
        height: 40
        canDropTask: () => true
        dragMimeType: "application/x-numbered-task"
        taskIndex: 2
    }
    SignalSpy {
        id: droppedSpy
        target: dragTarget
        signalName: "taskDropped"
    }

    function test_normal_item_routes_activation_menu_and_drop() {
        normalItem.activated(normalItem.taskIndex);
        compare(activationAdapter.entry.entryKey, "task");

        normalItem.contextMenuRequested({
            visualParent: normalItem
        });
        verify(contextMenuAdapter.request !== null);
        contextMenuAdapter.request.onContextMenuOpened();
        verify(normalItem.contextMenuOpen);
        contextMenuAdapter.request.onContextMenuClosed();
        verify(!normalItem.contextMenuOpen);

        moveAdapter.accepted = true;
        normalItem.taskDropped(1, 3, drop);
        compare(moveAdapter.move[0], 1);
        compare(drop.accepts, 1);
        moveAdapter.accepted = false;
        normalItem.taskDropped(2, 3, drop);
        compare(drop.accepts, 1);
    }

    function test_remote_item_routes_activation_and_menu() {
        remoteItem.activated();
        compare(remoteSource.activations, 1);
        remoteItem.contextMenuRequested({
            visualParent: remoteItem
        });
        remoteSource.request.onContextMenuOpened();
        verify(remoteItem.contextMenuOpen);
        remoteSource.request.onContextMenuClosed();
        verify(!remoteItem.contextMenuOpen);
    }

    function test_representation_derives_runtime_layout_from_items() {
        compare(representation.visibleItemCount, 2);
        verify(representation.taskSlotWidth > 0);
        representation.vertical = true;
        compare(representation.taskSlotWidth, representation.taskExtent);
        representation.vertical = false;
    }

    function test_drop_boundary_decodes_and_routes_mime_data() {
        dragTarget.handleTaskDragEntered(drop);
        verify(dragTarget.dropHover);
        dragTarget.handleTaskDrop(drop);
        compare(droppedSpy.count, 1);
        compare(droppedSpy.signalArguments[0][0], 1);
        compare(droppedSpy.signalArguments[0][1], 2);
        verify(!dragTarget.dropHover);
    }
}
