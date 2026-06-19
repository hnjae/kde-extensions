// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherCommandLogic.mjs" as LauncherCommandLogic

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
        const request = LauncherCommandLogic.launcherMutationRequest(action, launcherUrl);
        if (!request.ok) {
            actionResult(request);
            return request;
        }

        let accepted = false;
        try {
            accepted = requestLauncher(request.launcherUrl);
        } catch (error) {
            const failedResult = LauncherCommandLogic.launcherMutationResult(request, undefined, error);
            actionResult(failedResult);
            return failedResult;
        }

        const result = LauncherCommandLogic.launcherMutationResult(request, accepted);
        if (!result.ok) {
            actionResult(result);
            return result;
        }

        const launcherList = launcherPort && launcherPort.launcherList ? launcherPort.launcherList : [];
        if (!launcherSync || typeof launcherSync.persistLaunchers !== "function") {
            const missingSyncResult = LauncherCommandLogic.launcherMutationPersistenceResult(result, {
                code: "missing-launcher-sync",
                failedTargets: ["sync"],
                launchers: launcherList,
                ok: false
            });
            actionResult(missingSyncResult);
            return missingSyncResult;
        }

        let persistResult;
        try {
            persistResult = launcherSync.persistLaunchers(launcherList);
        } catch (error) {
            const failedResult = LauncherCommandLogic.launcherMutationPersistenceResult(result, {
                code: "launcher-persistence-threw",
                error: error,
                failedTargets: ["sync"],
                launchers: launcherList,
                ok: false
            });
            actionResult(failedResult);
            return failedResult;
        }

        const persistenceResult = LauncherCommandLogic.launcherMutationPersistenceResult(result, persistResult);
        if (!persistenceResult.ok) {
            actionResult(persistenceResult);
            return persistenceResult;
        }

        return persistenceResult;
    }

    function dispatchLauncherCommand(command) {
        const result = LauncherCommandLogic.contextMenuLauncherCommandDispatchResult(command);
        if (!result.ok) {
            actionResult(result);
            return result;
        }

        if (result.action === "pinLauncher") {
            return pinLauncher(result.launcherUrl);
        }

        if (result.action === "unpinLauncher") {
            return unpinLauncher(result.launcherUrl);
        }

        if (result.action === "replaceLauncherList") {
            launcherSync.applyLauncherList(result.launchers);
        }
        return result;
    }
}
