// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "EffectPorts"

    QtObject {
        id: model

        property var launcherList: ["applications:a.desktop"]
        property string lastCall: ""
        property var lastArgument: null

        function launcherActivities(url) {
            lastCall = "launcherActivities";
            lastArgument = url;
            return ["activity"];
        }
        function launcherPosition(url) {
            lastCall = "launcherPosition";
            lastArgument = url;
            return 3;
        }
        function requestActivate(index) {
            lastCall = "requestActivate";
            lastArgument = index;
        }
        function requestAddLauncher(url) {
            lastCall = "requestAddLauncher";
            lastArgument = url;
            return true;
        }
        function requestClose(index) {
            lastCall = "requestClose";
            lastArgument = index;
        }
        function requestRemoveLauncher(url) {
            lastCall = "requestRemoveLauncher";
            lastArgument = url;
            return true;
        }
    }

    NumberedTaskManager.TaskActivationPort {
        id: activationPort
        taskModel: model
    }
    NumberedTaskManager.LauncherCommandPort {
        id: launcherCommandPort
        taskModel: model
    }
    NumberedTaskManager.LauncherReadPort {
        id: launcherReadPort
        taskModel: model
    }
    NumberedTaskManager.TaskCommandPort {
        id: taskCommandPort
        taskModel: model
    }
    NumberedTaskManager.TaskMovePort {
        id: taskMovePort
        taskModel: model
    }

    function test_delegates_commands_and_reads() {
        activationPort.requestActivate("index-1");
        compare(model.lastCall, "requestActivate");
        compare(model.lastArgument, "index-1");

        verify(launcherCommandPort.requestAddLauncher("applications:b.desktop"));
        compare(model.lastCall, "requestAddLauncher");
        compare(launcherCommandPort.launcherList.length, 1);

        compare(launcherReadPort.launcherPosition("applications:a.desktop"), 3);
        compare(launcherReadPort.launcherActivities("applications:a.desktop")[0], "activity");
        compare(taskMovePort.launcherPosition("applications:a.desktop"), 3);

        verify(taskCommandPort.supportsContextMenuTaskRequest("requestClose"));
        verify(!taskCommandPort.supportsContextMenuTaskRequest("unknown"));
        taskCommandPort.requestClose("index-2");
        compare(model.lastCall, "requestClose");
    }
}
