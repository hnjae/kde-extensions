// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "LauncherFlow"

    QtObject {
        id: syncPort
        property var configLaunchers: ["old.desktop"]
        property var modelLaunchers: ["old.desktop"]
        property int configFailures: 0
        property bool updating: false
        function writeConfigLaunchers(launchers) {
            if (configFailures > 0) {
                --configFailures;
                throw new Error("config denied");
            }
            configLaunchers = Array.from(launchers);
        }
        function writeModelLaunchers(launchers) {
            modelLaunchers = Array.from(launchers);
        }
    }
    NumberedTaskManager.LauncherSyncAdapter {
        id: sync
        launcherSyncPort: syncPort
    }
    QtObject {
        id: launcherPort
        property var launcherList: ["applications:a.desktop"]
        property string requested: ""
        function requestAddLauncher(url) {
            requested = "add:" + url;
            return true;
        }
        function requestRemoveLauncher(url) {
            requested = "remove:" + url;
            return true;
        }
    }
    NumberedTaskManager.LauncherCommandAdapter {
        id: commands
        launcherPort: launcherPort
        launcherSync: sync
    }
    SignalSpy {
        id: syncResults
        target: sync
        signalName: "actionResult"
    }

    function init() {
        sync.retryTimer.stop();
        sync.launcherSyncState = ({
                maxRetries: 1,
                pending: false,
                retries: 0,
                targetLaunchers: []
            });
        syncPort.configLaunchers = ["old.desktop"];
        syncPort.modelLaunchers = ["old.desktop"];
        syncPort.configFailures = 0;
        syncResults.clear();
    }

    function test_partial_write_retries_through_timer() {
        syncPort.configFailures = 1;
        const result = sync.synchronizeLauncherList(["next.desktop"], "replaceLauncherList");
        compare(result.code, "reconciliation-pending");
        verify(!sync.updatingLauncherConfig);
        compare(syncPort.modelLaunchers[0], "next.desktop");
        tryCompare(syncPort, "configLaunchers", ["next.desktop"]);
        tryVerify(() => !sync.launcherSyncState.pending);
        compare(syncResults.count, 0);
    }

    function test_terminal_failure_is_reported_once() {
        syncPort.configFailures = 2;
        compare(sync.synchronizeLauncherList(["next.desktop"], "replaceLauncherList").code, "reconciliation-pending");
        tryCompare(syncResults, "count", 1);
        compare(syncResults.signalArguments[0][0].code, "reconciliation-expired");
        verify(!sync.launcherSyncState.pending);
        verify(!sync.updatingLauncherConfig);
    }

    function test_launcher_commands_cross_the_port_and_sync_boundary() {
        syncPort.configLaunchers = ["applications:a.desktop"];
        syncPort.modelLaunchers = ["applications:a.desktop"];
        verify(commands.pinLauncher("applications:a.desktop").ok);
        compare(launcherPort.requested, "add:applications:a.desktop");
        verify(commands.unpinLauncher("applications:a.desktop").ok);
        compare(launcherPort.requested, "remove:applications:a.desktop");
        verify(!commands.dispatchLauncherCommand({
            action: "unknown"
        }).ok);
    }
}
