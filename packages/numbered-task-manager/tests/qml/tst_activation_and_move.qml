// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "ActivationAndMove"

    QtObject {
        id: normalActivation
        property var requested: null
        function requestActivate(index) {
            requested = index;
        }
    }
    QtObject {
        id: remoteActivation
        property var requested: null
        function requestActivate(index) {
            requested = index;
        }
    }
    QtObject {
        id: manualStore
        property var move: []
        function moveManualTask(source, target) {
            move = [source, target];
            return true;
        }
    }
    QtObject {
        id: movePort
        property var launcherList: []
        function launcherPosition(url) {
            return -1;
        }
    }
    QtObject {
        id: launcherSync
        function synchronizeLauncherList(launchers, cause) {
            return {
                ok: true
            };
        }
    }

    NumberedTaskManager.TaskActivationAdapter {
        id: activation
        remoteAttentionSource: remoteActivation
        taskActivationPort: normalActivation
        visibleTaskItems: [
            {
                kind: "normal",
                sourceModel: "normal",
                entry: {
                    modelIndex: "normal-index",
                    sourceIndex: 0
                }
            },
            {
                kind: "remoteAttention",
                sourceModel: "remoteAttention",
                entry: {
                    modelIndex: "remote-index"
                }
            }
        ]
    }
    NumberedTaskManager.TaskMoveAdapter {
        id: mover
        launcherSync: launcherSync
        normalEntries: [
            {
                entryKey: "a",
                sourceIndex: 0,
                launcherBacked: false
            },
            {
                entryKey: "b",
                sourceIndex: 1,
                launcherBacked: false
            }
        ]
        normalTaskStore: manualStore
        taskMovePort: movePort
    }

    function test_routes_activation_by_source_owner() {
        verify(activation.activateTaskEntry({
            modelIndex: "normal-index",
            sourceIndex: 0
        }).ok);
        compare(normalActivation.requested, "normal-index");
        verify(activation.activateRemoteAttention({
            kind: "remoteAttention",
            sourceModel: "remoteAttention",
            entry: {
                modelIndex: "remote-index"
            }
        }).ok);
        compare(remoteActivation.requested, "remote-index");
    }

    function test_moves_only_within_valid_partition() {
        verify(mover.moveTask(0, 1));
        compare(manualStore.move[0], "a");
        compare(manualStore.move[1], "b");
        verify(!mover.moveTask(0, 8));
    }
}
