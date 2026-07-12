// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "SupportComponents"

    QtObject {
        id: activityInfo
        property string currentActivity: "activity-a"
    }
    QtObject {
        id: desktopInfo
        property string currentDesktop: "desktop-a"
    }
    QtObject {
        id: model
        property var launcherList: ["applications:a.desktop"]
        function launcherPosition(url) {
            return url === "applications:a.desktop" ? 0 : -1;
        }
    }
    QtObject {
        id: warningSink
        property var warnings: []
        function warn(message) {
            warnings.push(message);
            warningsChanged();
        }
    }

    NumberedTaskManager.TaskPlatformState {
        id: platform
        taskModel: model
        activityInfo: activityInfo
        virtualDesktopInfo: desktopInfo
    }
    NumberedTaskManager.TaskActionResultLogger {
        id: logger
        warningSink: warningSink
    }
    NumberedTaskManager.TaskEntryDiagnosticReporter {
        id: diagnostics
        sourceModel: "normal"
        sourceRow: 2
        roles: ({
                isWindow: true
            })
    }
    NumberedTaskManager.NormalTaskStoreAdapter {
        id: store
        visibleLauncherPosition: () => -1
    }
    SignalSpy {
        id: diagnosticResults
        target: diagnostics
        signalName: "actionResult"
    }

    function test_platform_providers_and_revision() {
        compare(platform.currentActivity, "activity-a");
        compare(platform.currentDesktop, "desktop-a");
        compare(platform.visibleLauncherPosition("applications:a.desktop"), 0);
        const revision = platform.launcherRevision;
        activityInfo.currentActivity = "activity-b";
        tryCompare(platform, "launcherRevision", revision + 1);
    }

    function test_logger_sink_and_diagnostic_deduplication() {
        warningSink.warnings = [];
        logger.logActionResult({
            action: "test",
            code: "ok",
            ok: true,
            fatal: false
        });
        compare(warningSink.warnings.length, 0);
        logger.logActionResult({
            action: "test",
            code: "failed",
            diagnostic: true,
            ok: false,
            context: {}
        });
        compare(warningSink.warnings.length, 1);

        diagnostics.emitDiagnostics();
        verify(diagnosticResults.count > 0);
        const count = diagnosticResults.count;
        diagnostics.emitDiagnostics();
        compare(diagnosticResults.count, count);
    }

    function test_store_publication_and_manual_move() {
        const firstKey = store.allocatePublicationKey();
        const secondKey = store.allocatePublicationKey();
        store.publishNormalTask(firstKey, true, {
            entryKey: firstKey,
            launcherBacked: false,
            sourceIndex: 0
        });
        store.publishNormalTask(secondKey, true, {
            entryKey: secondKey,
            launcherBacked: false,
            sourceIndex: 1
        });
        compare(store.entries.length, 2);
        verify(store.moveManualTask(firstKey, secondKey));
        compare(store.entries[0].entryKey, secondKey);
        store.removeNormalTask(firstKey);
        compare(store.entries.length, 1);
    }
}
