// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic

QtQuick.QtObject {
    id: root

    property var launcherSync
    property var launcherPort

    signal actionResult(var result)

    function pinLauncher(launcherUrl) {
        return requestLauncherMutation("pinLauncher", launcherUrl, url => launcherPort.requestAddLauncher(url));
    }

    function unpinLauncher(launcherUrl) {
        return requestLauncherMutation("unpinLauncher", launcherUrl, url => launcherPort.requestRemoveLauncher(url));
    }

    function requestLauncherMutation(action, launcherUrl, requestLauncher) {
        const request = TaskActionLogic.launcherMutationRequest(action, launcherUrl);
        if (!request.ok) {
            actionResult(request);
            return false;
        }

        let accepted = false;
        try {
            accepted = requestLauncher(request.launcherUrl);
        } catch (error) {
            const failedResult = TaskActionLogic.launcherMutationResult(request, undefined, error);
            actionResult(failedResult);
            return false;
        }

        const result = TaskActionLogic.launcherMutationResult(request, accepted);
        if (!result.ok) {
            actionResult(result);
            return false;
        }

        const launcherList = launcherPort && launcherPort.launcherList ? launcherPort.launcherList : [];
        if (!launcherSync || typeof launcherSync.persistLaunchers !== "function") {
            const missingSyncResult = TaskActionLogic.launcherMutationPersistenceResult(result, {
                code: "missing-launcher-sync",
                failedTargets: ["sync"],
                launchers: launcherList,
                ok: false
            });
            actionResult(missingSyncResult);
            return false;
        }

        let persistResult;
        try {
            persistResult = launcherSync.persistLaunchers(launcherList);
        } catch (error) {
            const failedResult = TaskActionLogic.launcherMutationPersistenceResult(result, {
                code: "launcher-persistence-threw",
                error: error,
                failedTargets: ["sync"],
                launchers: launcherList,
                ok: false
            });
            actionResult(failedResult);
            return false;
        }

        const persistenceResult = TaskActionLogic.launcherMutationPersistenceResult(result, persistResult);
        if (!persistenceResult.ok) {
            actionResult(persistenceResult);
            return false;
        }

        return true;
    }

    function dispatchLauncherCommand(command) {
        const result = TaskActionLogic.contextMenuLauncherCommandDispatchResult(command);
        if (!result.ok) {
            actionResult(result);
            return result;
        }

        if (result.action === "pinLauncher") {
            pinLauncher(result.launcherUrl);
            return result;
        }

        if (result.action === "unpinLauncher") {
            unpinLauncher(result.launcherUrl);
            return result;
        }

        if (result.action === "replaceLauncherList") {
            launcherSync.applyLauncherList(result.launchers);
        }
        return result;
    }
}
