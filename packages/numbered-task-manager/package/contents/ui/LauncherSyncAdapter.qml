// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherSyncLogic.mjs" as LauncherSyncLogic

QtQuick.QtObject {
    id: root

    property var launcherSyncPort
    property var launcherSyncState: LauncherSyncLogic.createLauncherSyncState()
    property bool updatingLauncherConfig: false
    readonly property QtQuick.Timer retryTimer: QtQuick.Timer {
        interval: 0
        repeat: false

        onTriggered: {
            root.retryPendingLauncherSync();
        }
    }

    signal actionResult(var result)

    function syncPorts() {
        return {
            readConfigLaunchers: () => root.launcherSyncPort.configLaunchers,
            readModelLaunchers: () => root.launcherSyncPort.modelLaunchers,
            setUpdatingLauncherConfig: updating => {
                updatingLauncherConfig = updating;
            },
            writeConfigLaunchers: launchers => {
                root.launcherSyncPort.writeConfigLaunchers(launchers);
            },
            writeModelLaunchers: launchers => {
                root.launcherSyncPort.writeModelLaunchers(launchers);
            }
        };
    }

    function applySyncOutput(action, output) {
        if (!output) {
            return null;
        }

        launcherSyncState = output.state || launcherSyncState;
        if (output.retryRequested) {
            retryTimer.restart();
        } else {
            retryTimer.stop();
        }
        logLauncherSyncResult(action, output.result);
        return output.result || null;
    }

    function synchronizeLauncherList(launchers, cause) {
        const action = cause || "synchronizeLauncherList";
        const output = LauncherSyncLogic.synchronizeLauncherList(launchers, syncPorts(), launcherSyncState, action);
        return applySyncOutput(action, output);
    }

    function observeModelLauncherList(modelLaunchers) {
        const action = "observeModelLauncherList";
        const output = LauncherSyncLogic.observeModelLauncherList(modelLaunchers, syncPorts(), launcherSyncState);
        applySyncOutput(action, output);
        return Boolean(output && output.handled);
    }

    function retryPendingLauncherSync() {
        const action = "retryLauncherList";
        const output = LauncherSyncLogic.retryPendingLauncherSync(syncPorts(), launcherSyncState, action);
        return applySyncOutput(action, output);
    }

    function logLauncherSyncResult(action, result) {
        const syncActionResult = LauncherSyncLogic.launcherSyncActionResult(action, result);
        if (syncActionResult) {
            actionResult(syncActionResult);
        }
    }
}
