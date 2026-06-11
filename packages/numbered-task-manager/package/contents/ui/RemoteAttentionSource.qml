// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import org.kde.taskmanager as TaskManager
import "RemoteAttentionLogic.mjs" as RemoteAttentionLogic
import "TaskEntryLogic.mjs" as TaskEntryLogic
import "TaskScopeLogic.mjs" as TaskScopeLogic
import "VisibleTaskItemsLogic.mjs" as VisibleTaskItemsLogic

QtQuick.Item {
    id: root

    readonly property var taskModel: attentionTasksModel
    property string currentActivity: ""
    property string currentDesktop: ""
    property var isInCurrentActivity: null
    property var visibleTaskItems: []
    property var attentionState: RemoteAttentionLogic.createRemoteAttentionState()
    readonly property int count: attentionState.count || 0
    readonly property var target: attentionState.target || null
    readonly property var snapshot: ({
            count: root.count,
            target: root.target
        })
    readonly property var visibleItem: VisibleTaskItemsLogic.visibleRemoteAttentionItem(root.visibleTaskItems)
    readonly property var itemEntry: root.visibleItem ? root.visibleItem.entry || ({}) : ({})
    readonly property bool itemVisible: Boolean(root.visibleItem)
    readonly property int itemCount: root.visibleItem ? root.visibleItem.count || 0 : 0
    readonly property var itemIconSource: root.itemEntry.iconSource || TaskEntryLogic.remoteAttentionIconFallback()
    readonly property var itemModelIndex: root.itemEntry.modelIndex
    readonly property var itemTaskData: root.itemEntry
    readonly property string itemTitle: root.itemEntry.title || ""

    signal actionResult(var result)
    signal attentionPublished(string previousKey, string key, bool qualifies, var task, bool becameQualified)
    signal attentionRemoved(string key)
    signal activationRequested(var visibleItem)
    signal contextMenuRequested(var request)

    height: 0
    visible: false
    width: 0

    function taskIsInCurrentActivity(activities) {
        if (typeof root.isInCurrentActivity !== "function") {
            return true;
        }

        return root.isInCurrentActivity(activities);
    }

    function requestActivate(modelIndex) {
        attentionTasksModel.requestActivate(modelIndex);
    }

    function requestVisibleActivation() {
        root.activationRequested(root.visibleItem);
    }

    function requestVisibleContextMenu(request) {
        root.contextMenuRequested(Object.assign({
            taskModel: root.taskModel
        }, request));
    }

    function publishRemoteAttention(previousKey, key, qualifies, task, becameQualified) {
        const result = RemoteAttentionLogic.publishRemoteAttentionState(attentionState, previousKey, key, qualifies, task, becameQualified);
        attentionState = result.state;
        root.attentionPublished(previousKey, key, qualifies, task, becameQualified);
        return result.publishedKey;
    }

    function removeRemoteAttention(key) {
        const result = RemoteAttentionLogic.removeRemoteAttentionState(attentionState, key);
        if (result.state !== attentionState) {
            attentionState = result.state;
        }
        root.attentionRemoved(key);
    }

    TaskManager.TasksModel {
        id: attentionTasksModel

        activity: root.currentActivity
        filterByActivity: TaskScopeLogic.remoteAttentionModelFilterSettings().filterByActivity
        filterByScreen: TaskScopeLogic.remoteAttentionModelFilterSettings().filterByScreen
        filterByVirtualDesktop: TaskScopeLogic.remoteAttentionModelFilterSettings().filterByVirtualDesktop
        groupMode: TaskManager.TasksModel.GroupDisabled
        sortMode: TaskManager.TasksModel.SortManual
        virtualDesktop: root.currentDesktop
    }

    QtQuick.Repeater {
        model: root.taskModel

        delegate: QtQuick.Item {
            required property int index
            required property var model

            property string launcherUrl: TaskEntryLogic.launcherUrlFromRoles(model.LauncherUrlWithoutIcon, model.LauncherUrl)
            property bool hasSyncedAttention: false
            property var persistentModelIndex: root.taskModel.makePersistentModelIndex(index)
            property string publishedKey: ""
            property bool previousQualifies: false
            property var taskInfo: RemoteAttentionLogic.createRemoteAttentionEntry({
                activities: model.Activities,
                appName: model.AppName,
                demandingAttention: model.IsDemandingAttention,
                display: model.display,
                iconSource: model.decoration,
                index,
                isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                isWindow: model.IsWindow,
                launcherUrl,
                modelIndex: persistentModelIndex,
                virtualDesktops: model.VirtualDesktops,
                winIds: model.WinIdList
            })
            property string taskKey: RemoteAttentionLogic.remoteAttentionKey(taskInfo.winIds, taskInfo.launcherUrl, taskInfo.title, index)
            property bool qualifies: TaskScopeLogic.remoteAttentionQualifies(taskInfo, activities => root.taskIsInCurrentActivity(activities), root.currentDesktop)

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
                        isOnAllVirtualDesktops: model.IsOnAllVirtualDesktops,
                        isWindow: model.IsWindow,
                        modelIndex: persistentModelIndex,
                        virtualDesktops: model.VirtualDesktops
                    })
                sourceModel: "remoteAttention"
                sourceRow: index

                onActionResult: result => {
                    root.actionResult(result);
                }
            }

            function syncAttention() {
                const becameQualified = hasSyncedAttention && !previousQualifies && qualifies;
                publishedKey = root.publishRemoteAttention(publishedKey, taskKey, qualifies, taskInfo, becameQualified);
                taskEntryDiagnostics.emitDiagnostics();
                previousQualifies = qualifies;
                hasSyncedAttention = true;
            }

            QtQuick.Component.onCompleted: syncAttention()
            QtQuick.Component.onDestruction: {
                root.removeRemoteAttention(publishedKey);
            }
            onQualifiesChanged: syncAttention()
            onTaskInfoChanged: syncAttention()
            onTaskKeyChanged: syncAttention()
        }
    }
}
