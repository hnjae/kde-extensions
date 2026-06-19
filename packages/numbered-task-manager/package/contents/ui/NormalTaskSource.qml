// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherListLogic.mjs" as LauncherListLogic
import "TaskEntryLogic.mjs" as TaskEntryLogic
import "TaskModelLogic.mjs" as TaskModelLogic
import "TaskScopeLogic.mjs" as TaskScopeLogic
import "VisibleTaskItemsLogic.mjs" as VisibleTaskItemsLogic

QtQuick.Item {
    id: root

    property var taskModel: null
    property var currentActivity: ""
    property var currentDesktop: ""
    property int launcherRevision: 0
    property var createPublicationKey: null
    property var isInCurrentActivity: null
    property var visibleLauncherPosition: null

    signal actionResult(var result)
    signal taskPublished(string key, bool qualifies, var task)
    signal taskRemoved(string key)

    height: 0
    visible: false
    width: 0

    function allocatePublicationKey() {
        if (typeof root.createPublicationKey !== "function") {
            return "";
        }

        return root.createPublicationKey();
    }

    function launcherPositionForUrl(launcherUrl, launcherRevisionToken) {
        if (typeof root.visibleLauncherPosition !== "function") {
            return -1;
        }

        return root.visibleLauncherPosition(launcherUrl, launcherRevisionToken);
    }

    function taskIsInCurrentActivity(activities) {
        if (typeof root.isInCurrentActivity !== "function") {
            return true;
        }

        return root.isInCurrentActivity(activities);
    }

    QtQuick.Repeater {
        model: root.taskModel

        delegate: QtQuick.Item {
            required property int index
            required property var model

            property string launcherUrl: TaskEntryLogic.launcherUrlFromRoles(model.LauncherUrlWithoutIcon, model.LauncherUrl)
            property int launcherRevisionToken: root.launcherRevision
            property var launcherPinState: LauncherListLogic.launcherPinState(root.taskModel.launcherList, launcherUrl, root.currentActivity, url => root.taskModel.launcherPosition(url), launcherRevisionToken)
            property int launcherPosition: launcherPinState.pinnedLauncherPosition
            property bool launcherPinned: launcherPinState.isPinned
            property var persistentModelIndex: root.taskModel.makePersistentModelIndex(index)
            property string publishedKey: ""
            property var taskInfo: TaskModelLogic.createNormalTaskEntry({
                activities: model.Activities,
                active: model.IsActive,
                appName: model.AppName,
                canLaunchNewInstance: model.CanLaunchNewInstance,
                canSetNoBorder: model.CanSetNoBorder,
                closable: model.IsClosable,
                demandingAttention: model.IsDemandingAttention,
                display: model.display,
                entryKey: publishedKey,
                fullScreenable: model.IsFullScreenable,
                hasNoBorder: model.HasNoBorder,
                iconSource: model.decoration,
                index,
                isExcludedFromCapture: model.IsExcludedFromCapture,
                isFullScreen: model.IsFullScreen,
                isKeepAbove: model.IsKeepAbove,
                isKeepBelow: model.IsKeepBelow,
                isLauncher: model.IsLauncher,
                isMaximizable: model.IsMaximizable,
                isMaximized: model.IsMaximized,
                isMinimizable: model.IsMinimizable,
                isMinimized: model.IsMinimized,
                isMovable: model.IsMovable,
                isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                isResizable: model.IsResizable,
                isShadeable: model.IsShadeable,
                isShaded: model.IsShaded,
                isStartup: model.IsStartup,
                isVirtualDesktopsChangeable: model.IsVirtualDesktopsChangeable,
                isWindow: model.IsWindow,
                launcherPinned,
                launcherPosition,
                launcherUrl,
                modelIndex: persistentModelIndex,
                virtualDesktops: model.VirtualDesktops
            })
            property bool qualifies: TaskScopeLogic.normalTaskQualifies(taskInfo, activities => root.taskIsInCurrentActivity(activities), root.currentDesktop)

            height: 0
            visible: false
            width: 0

            TaskEntryDiagnosticReporter {
                id: taskEntryDiagnostics

                publicationKey: publishedKey
                roles: ({
                        activities: model.Activities,
                        demandingAttention: model.IsDemandingAttention,
                        index: index,
                        isLauncher: model.IsLauncher,
                        isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                        isWindow: model.IsWindow,
                        modelIndex: persistentModelIndex,
                        virtualDesktops: model.VirtualDesktops
                    })
                sourceModel: VisibleTaskItemsLogic.normalItemKind
                sourceRow: index

                onActionResult: result => {
                    root.actionResult(result);
                }
            }

            function syncTask() {
                if (!publishedKey) {
                    return;
                }

                taskEntryDiagnostics.emitDiagnostics();
                const task = Object.assign({}, taskInfo);
                task.entryKey = publishedKey;
                root.taskPublished(publishedKey, qualifies, task);
            }

            QtQuick.Component.onCompleted: {
                publishedKey = root.allocatePublicationKey();
                syncTask();
            }
            QtQuick.Component.onDestruction: {
                root.taskRemoved(publishedKey);
            }
            onIndexChanged: syncTask()
            onLauncherPinnedChanged: syncTask()
            onLauncherPositionChanged: syncTask()
            onQualifiesChanged: syncTask()
            onTaskInfoChanged: syncTask()
        }
    }
}
