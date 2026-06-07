// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherListLogic.js" as LauncherListLogic

QtQuick.QtObject {
    id: root

    property var configuration
    property var launcherReconciliationState: LauncherListLogic.createLauncherReconciliationState()
    property var taskModel
    property bool updatingLauncherConfig: false

    function configurationLaunchers() {
        return configuration ? configuration.launchers : [];
    }

    function modelLaunchers() {
        return taskModel ? taskModel.launcherList : [];
    }

    function persistLaunchers(launchers) {
        const update = LauncherListLogic.launcherConfigUpdate(configurationLaunchers(), launchers);
        if (!update.changed) {
            return LauncherListLogic.launcherConfigConvergence(update, configurationLaunchers());
        }

        const result = LauncherListLogic.runLauncherListUpdateTransaction(root, () => {
            configuration.launchers = update.launchers;
            return LauncherListLogic.launcherConfigConvergence(update, configurationLaunchers());
        });
        recordLauncherSyncResult("persistLaunchers", result);
        return result;
    }

    function applyLauncherList(launchers) {
        const update = LauncherListLogic.launcherModelUpdate(modelLaunchers(), configurationLaunchers(), launchers);
        if (!update.changed) {
            return false;
        }

        const result = LauncherListLogic.runLauncherListUpdateTransaction(root, () => {
            if (update.modelChanged) {
                taskModel.launcherList = update.launchers;
            }
            if (update.configChanged) {
                configuration.launchers = update.launchers;
            }
            return LauncherListLogic.launcherModelConvergence(update, modelLaunchers(), configurationLaunchers());
        });
        recordLauncherSyncResult("applyLauncherList", result);
        return Boolean(result && result.changed);
    }

    function recordLauncherSyncResult(action, result) {
        launcherReconciliationState = LauncherListLogic.launcherReconciliationAfterResult(launcherReconciliationState, result);
        logLauncherSyncResult(action, result);
    }

    function reconcileLauncherListChange(modelLaunchers) {
        const decision = LauncherListLogic.launcherReconciliationDecision(launcherReconciliationState, modelLaunchers, configurationLaunchers());
        launcherReconciliationState = decision.state;
        if (decision.action === "none") {
            return false;
        }

        if (decision.action === "retry") {
            applyLauncherList(decision.launchers);
            return true;
        }

        if (decision.action === "expired") {
            const expiredResult = LauncherListLogic.launcherModelConvergence({
                changed: true,
                launchers: decision.launchers || []
            }, modelLaunchers, configurationLaunchers());
            logLauncherSyncResult("reconcileLauncherList", Object.assign({}, expiredResult, {
                code: "reconciliation-expired",
                ok: false
            }));
        }

        return true;
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
            modelLaunchers: result.modelLaunchers || []
        }));
    }
}
