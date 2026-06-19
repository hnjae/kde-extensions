// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherSyncLogic.mjs" as LauncherSyncLogic

QtQuick.QtObject {
    id: root

    property var launcherSyncPort
    property var launcherSyncState: LauncherSyncLogic.createLauncherSyncState()
    property var launcherReconciliationState: launcherSyncState.reconciliation
    property bool updatingLauncherConfig: false

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

    function persistLaunchers(launchers) {
        const output = LauncherSyncLogic.persistLaunchers(launchers, syncPorts(), launcherSyncState);
        launcherSyncState = output.state;
        logLauncherSyncResult("persistLaunchers", output.result);
        return output.result;
    }

    function applyLauncherList(launchers) {
        const output = LauncherSyncLogic.applyLauncherList(launchers, syncPorts(), launcherSyncState);
        launcherSyncState = output.state;
        logLauncherSyncResult("applyLauncherList", output.result);
        return Boolean(output.changed);
    }

    function recordLauncherSyncResult(action, result) {
        launcherSyncState = LauncherSyncLogic.launcherSyncStateAfterResult(launcherSyncState, result);
        logLauncherSyncResult(action, result);
    }

    function reconcileLauncherListChange(modelLaunchers) {
        const output = LauncherSyncLogic.reconcileLauncherListChange(modelLaunchers, syncPorts(), launcherSyncState);
        launcherSyncState = output.state;
        logLauncherSyncResult("reconcileLauncherList", output.result);
        return Boolean(output.handled);
    }

    function logLauncherSyncResult(action, result) {
        if (!result || result.ok) {
            return;
        }

        console.warn("Numbered Task Manager launcher sync " + action + " " + result.code + ": " + JSON.stringify({
            configLaunchers: result.configLaunchers || [],
            error: result.error || "",
            failedTargets: result.failedTargets || [],
            launchers: result.launchers || [],
            modelLaunchers: result.modelLaunchers || [],
            retryClassification: result.retryClassification || ""
        }));
    }
}
