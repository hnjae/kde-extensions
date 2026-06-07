// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskContextMenuLogic.js" as TaskContextMenuLogic

QtQuick.QtObject {
    id: root

    property var launcherActivityList: []
    property var launcherModel
    property string launcherUrl: ""

    signal launcherCommandRequested(var command)

    function refreshLauncherActivities() {
        if (!launcherModel || !launcherUrl) {
            launcherActivityList = [];
            return;
        }

        launcherActivityList = TaskContextMenuLogic.launcherActivityListSnapshot(launcherModel.launcherActivities(launcherUrl));
    }

    function applyLauncherActivityUpdate(update) {
        if (!update.ok) {
            return false;
        }

        launcherActivityList = update.activities;
        if (!update.changed) {
            return false;
        }

        launcherCommandRequested(update.command);
        return true;
    }

    function applyLauncherActivityAction(update) {
        if (!launcherModel || !launcherUrl) {
            return false;
        }

        const changed = applyLauncherActivityUpdate(update);
        refreshLauncherActivities();
        return changed;
    }
}
