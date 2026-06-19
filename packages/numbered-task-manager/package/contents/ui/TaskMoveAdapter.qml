// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "LauncherListLogic.mjs" as LauncherListLogic
import "TaskActionLogic.mjs" as TaskActionLogic
import "TaskModelLogic.mjs" as TaskModelLogic

QtQuick.QtObject {
    id: root

    property var launcherSync
    property var normalEntries: []
    property var normalTaskStore
    property var taskMovePort

    signal actionResult(var result)

    function moveTask(sourceIndex, targetIndex) {
        const moveDecision = canMoveTaskResult(sourceIndex, targetIndex);
        if (!moveDecision.canMove) {
            rejectDragMove(moveDecision, sourceIndex, targetIndex);
            return false;
        }

        const sourceEntry = normalTaskEntryForSourceIndex(sourceIndex);
        const targetEntry = normalTaskEntryForSourceIndex(targetIndex);
        if (!sourceEntry || !targetEntry) {
            rejectDragMove(TaskModelLogic.canMoveTaskResult(normalEntries, sourceIndex, targetIndex, (sourceEntry, targetEntry) => canMovePinnedLauncher(sourceEntry, targetEntry)), sourceIndex, targetIndex);
            return false;
        }

        if (!sourceEntry.launcherBacked) {
            return normalTaskStore.moveManualTask(sourceEntry.entryKey, targetEntry.entryKey);
        }

        return movePinnedLauncher(sourceEntry, targetEntry);
    }

    function movePinnedLauncher(sourceEntry, targetEntry) {
        const result = LauncherListLogic.movePinnedLauncher(taskMovePort.launcherList, sourceEntry, targetEntry, launcherUrl => taskMovePort.launcherPosition(launcherUrl));
        if (!result.moved) {
            return false;
        }

        return launcherSync.applyLauncherList(result.launchers);
    }

    function canMovePinnedLauncher(sourceEntry, targetEntry) {
        return LauncherListLogic.canMovePinnedLauncher(taskMovePort.launcherList, sourceEntry, targetEntry, launcherUrl => taskMovePort.launcherPosition(launcherUrl));
    }

    function canMoveTaskResult(sourceIndex, targetIndex) {
        return TaskModelLogic.canMoveTaskResult(normalEntries, sourceIndex, targetIndex, (sourceEntry, targetEntry) => canMovePinnedLauncher(sourceEntry, targetEntry));
    }

    function canMoveTask(sourceIndex, targetIndex) {
        return canMoveTaskResult(sourceIndex, targetIndex).canMove;
    }

    function rejectDragMove(moveDecision, sourceIndex, targetIndex) {
        const rejection = TaskActionLogic.dragMoveRejectionResult(moveDecision, sourceIndex, targetIndex);
        actionResult(rejection);
        return rejection;
    }

    function normalTaskEntryForSourceIndex(sourceIndex) {
        return TaskModelLogic.normalTaskEntryForSourceIndex(normalEntries, sourceIndex);
    }
}
