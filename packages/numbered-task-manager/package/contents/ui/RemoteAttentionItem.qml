// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick.Layouts as QtQuickLayouts

AttentionItem {
    id: root

    required property var source
    property bool vertical: false
    property real taskSlotWidth: 0

    QtQuickLayouts.Layout.fillHeight: !root.vertical
    QtQuickLayouts.Layout.fillWidth: root.vertical
    QtQuickLayouts.Layout.preferredWidth: root.vertical ? implicitWidth : root.taskSlotWidth

    count: root.source.itemCount
    iconSource: root.source.itemIconSource
    modelIndex: root.source.itemModelIndex
    slotWidth: root.vertical ? 0 : root.taskSlotWidth
    taskData: root.source.itemTaskData
    title: root.source.itemTitle
    visible: root.source.itemVisible

    onActivated: {
        root.source.requestVisibleActivation();
    }

    onContextMenuRequested: request => {
        root.source.requestVisibleContextMenu(Object.assign({}, request, {
            onContextMenuOpened: () => {
                root.contextMenuOpen = true;
            },
            onContextMenuClosed: () => {
                root.contextMenuOpen = false;
            }
        }));
    }
}
