// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "NormalTaskSourceLifecycleLogic.mjs" as NormalTaskSourceLifecycleLogic
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
            property int launcherPosition: launcherPositionForUrl(launcherUrl, launcherRevisionToken)
            property bool launcherPinned: launcherPosition !== -1
            property var persistentModelIndex: root.taskModel.makePersistentModelIndex(index)
            property var lifecycleState: NormalTaskSourceLifecycleLogic.createNormalTaskSourceRowState()
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

            function lifecycleSnapshot() {
                return {
                    qualifies,
                    task: taskInfo
                };
            }

            function executeLifecycleCommands(output) {
                lifecycleState = output.state;
                publishedKey = lifecycleState.publishedKey || "";
                const commands = Array.from(output.commands || []);
                for (let i = 0; i < commands.length; ++i) {
                    const command = commands[i];
                    if (command.type === "emitDiagnostics") {
                        taskEntryDiagnostics.emitDiagnostics();
                    } else if (command.type === "publishTask") {
                        root.taskPublished(command.key, command.qualifies, command.task);
                    } else if (command.type === "removeTask") {
                        root.taskRemoved(command.key);
                    }
                }
            }

            function syncTask() {
                executeLifecycleCommands(NormalTaskSourceLifecycleLogic.normalTaskSourceRowChanged(lifecycleState, lifecycleSnapshot()));
            }

            QtQuick.Component.onCompleted: {
                executeLifecycleCommands(NormalTaskSourceLifecycleLogic.normalTaskSourceRowAppeared(lifecycleState, root.allocatePublicationKey(), lifecycleSnapshot()));
            }
            QtQuick.Component.onDestruction: {
                executeLifecycleCommands(NormalTaskSourceLifecycleLogic.normalTaskSourceRowRemoved(lifecycleState));
            }
            onIndexChanged: syncTask()
            onLauncherPinnedChanged: syncTask()
            onLauncherPositionChanged: syncTask()
            onQualifiesChanged: syncTask()
            onTaskInfoChanged: syncTask()
        }
    }
}
