// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic
import "TaskContextMenuLauncherActivityLogic.mjs" as LauncherActivityLogic

QtQuick.QtObject {
    id: root

    property var launcherActivityList: []
    property var launcherModel
    property string launcherUrl: ""

    signal actionResult(var result)
    signal launcherCommandRequested(var command)

    function launcherActivityFailure(update, code) {
        const result = TaskActionLogic.contextMenuLauncherActivityResult(update, code, launcherUrl);
        actionResult(result);
        return false;
    }

    function refreshLauncherActivities() {
        if (!launcherModel || !launcherUrl) {
            launcherActivityList = [];
            return;
        }

        launcherActivityList = LauncherActivityLogic.launcherActivityListSnapshot(launcherModel.launcherActivities(launcherUrl));
    }

    function applyLauncherActivityUpdate(update) {
        if (!update.ok) {
            return launcherActivityFailure(update, "invalid-launcher-activity-update");
        }

        launcherActivityList = update.activities;
        if (!update.changed) {
            return false;
        }

        launcherCommandRequested(update.command);
        return true;
    }

    function applyLauncherActivityAction(update) {
        if (!launcherModel) {
            return launcherActivityFailure(update, "missing-launcher-model");
        }
        if (!launcherUrl) {
            return launcherActivityFailure(update, "missing-launcher-url");
        }

        const changed = applyLauncherActivityUpdate(update);
        refreshLauncherActivities();
        return changed;
    }
}
