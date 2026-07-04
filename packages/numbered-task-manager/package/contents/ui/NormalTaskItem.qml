// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import "TaskEntryLogic.mjs" as TaskEntryLogic

TaskItem {
    id: root

    required property var activationAdapter
    required property var contextMenuAdapter
    required property var moveAdapter
    required property var visibleItem
    property string taskDragMimeType: ""
    property int taskTitleVisibilityThreshold: 0
    property real taskListHeight: 0
    property real taskListWidth: 0
    property real taskSlotWidth: 0
    readonly property var item: root.visibleItem || ({})
    readonly property var entry: root.item.entry || ({})

    height: root.vertical ? implicitHeight : root.taskListHeight
    width: root.vertical ? root.taskListWidth : root.taskSlotWidth
    slotWidth: root.vertical ? 0 : root.taskSlotWidth
    taskIndex: root.entry.moveIndex ?? root.entry.sourceIndex ?? -1
    modelIndex: root.entry.modelIndex
    slotNumber: root.item.slotNumber || 0
    title: root.entry.title || ""
    showTitle: !(root.entry.launcherBacked && root.entry.isLauncher)
    titleVisibilityThreshold: root.taskTitleVisibilityThreshold
    iconSource: root.entry.iconSource || TaskEntryLogic.normalTaskIconFallback()
    active: root.entry.active || false
    minimized: root.entry.isMinimized || false
    pinnedLauncherOnly: root.entry.launcherBacked && root.entry.isLauncher
    launcher: root.entry.isLauncher || false
    demandingAttention: root.entry.demandingAttention || false
    dragMimeType: root.taskDragMimeType
    canDropTask: (sourceIndex, targetIndex) => root.moveAdapter.canMoveTaskResult(sourceIndex, targetIndex).canMove
    taskData: root.entry

    onActivated: {
        root.activationAdapter.activateTaskEntry(root.entry);
    }

    onContextMenuRequested: request => {
        root.contextMenuAdapter.openTaskContextMenu(Object.assign({}, request, {
            onContextMenuOpened: () => {
                root.contextMenuOpen = true;
            },
            onContextMenuClosed: () => {
                root.contextMenuOpen = false;
            }
        }));
    }

    onTaskDropped: (sourceIndex, targetIndex, drop) => {
        if (root.moveAdapter.moveTask(sourceIndex, targetIndex)) {
            drop.acceptProposedAction();
        }
    }
}
