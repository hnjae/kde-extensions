// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "RemoteAttentionLogic.js" as RemoteAttentionLogic
import "TaskEntryLogic.js" as TaskEntryLogic

QtQuick.Item {
    id: root

    property var taskModel: null
    property string currentDesktop: ""
    property var isInCurrentActivity: null
    property var publishAttention: null
    property var removeAttention: null

    signal attentionPublished(string previousKey, string key, bool qualifies, var task, bool becameQualified)
    signal attentionRemoved(string key)

    height: 0
    visible: false
    width: 0

    function taskIsInCurrentActivity(activities) {
        if (typeof root.isInCurrentActivity !== "function") {
            return true;
        }

        return root.isInCurrentActivity(activities);
    }

    function publishRemoteAttention(previousKey, key, qualifies, task, becameQualified) {
        root.attentionPublished(previousKey, key, qualifies, task, becameQualified);
        if (typeof root.publishAttention !== "function") {
            return qualifies ? key : "";
        }

        return root.publishAttention(previousKey, key, qualifies, task, becameQualified);
    }

    function removeRemoteAttention(key) {
        root.attentionRemoved(key);
        if (typeof root.removeAttention === "function") {
            root.removeAttention(key);
        }
    }

    QtQuick.Repeater {
        model: root.taskModel

        delegate: QtQuick.Item {
            required property int index
            required property var model

            property string launcherUrl: String(model.LauncherUrlWithoutIcon || model.LauncherUrl || "")
            property bool hasSyncedAttention: false
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
                modelIndex: root.taskModel.makePersistentModelIndex(index),
                virtualDesktops: model.VirtualDesktops,
                winIds: model.WinIdList
            }, TaskEntryLogic)
            property string taskKey: RemoteAttentionLogic.remoteAttentionKey(taskInfo.winIds, taskInfo.launcherUrl, taskInfo.title, index)
            property bool qualifies: RemoteAttentionLogic.qualifiesRemoteAttention(taskInfo, activities => root.taskIsInCurrentActivity(activities), root.currentDesktop, TaskEntryLogic)

            height: 0
            visible: false
            width: 0

            function syncAttention() {
                const becameQualified = hasSyncedAttention && !previousQualifies && qualifies;
                publishedKey = root.publishRemoteAttention(publishedKey, taskKey, qualifies, taskInfo, becameQualified);
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
