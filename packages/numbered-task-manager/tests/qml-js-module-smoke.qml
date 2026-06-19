// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQml
import "../package/contents/ui/ActivityScopeLogic.mjs" as ActivityScopeLogic
import "../package/contents/ui/TaskActivationLogic.mjs" as TaskActivationLogic
import "../package/contents/ui/TaskContextMenuLogic.mjs" as TaskContextMenuLogic
import "../package/contents/ui/TaskContextMenuRouteLogic.mjs" as TaskContextMenuRouteLogic
import "../package/contents/ui/TaskItemPresentationLogic.mjs" as TaskItemPresentationLogic
import "../package/contents/ui/TaskMetricsLogic.mjs" as TaskMetricsLogic
import "../package/contents/ui/TaskModelLogic.mjs" as TaskModelLogic

QtObject {
    Component.onCompleted: {
        if (ActivityScopeLogic.allActivitiesId() !== "00000000-0000-0000-0000-000000000000") {
            throw new Error("ActivityScopeLogic.mjs did not load");
        }
        if (TaskMetricsLogic.taskExtent() !== 40) {
            throw new Error("TaskMetricsLogic.mjs did not load");
        }
        if (TaskItemPresentationLogic.taskItemPresentation({
            frameExtent: 40,
            slotNumber: 1
        }).numberMode !== "overlay") {
            throw new Error("TaskItemPresentationLogic.mjs did not load its dependency");
        }
        if (!TaskModelLogic.createNormalTaskEntry({
            index: 1,
            isLauncher: true
        }).isLauncher) {
            throw new Error("TaskModelLogic.mjs did not load its dependency");
        }
        if (TaskActivationLogic.shortcutActivationRequest([], 0).code !== "no-target") {
            throw new Error("TaskActivationLogic.mjs did not load its dependency");
        }
        if (TaskContextMenuLogic.panelMenuPlacement(0, {}, {
            TopPosedLeftAlignedPopup: 1
        }) !== 1) {
            throw new Error("TaskContextMenuLogic.mjs did not load");
        }
        if (!TaskContextMenuRouteLogic.isNoneRoute(TaskContextMenuRouteLogic.contextMenuActionRoute(null))) {
            throw new Error("TaskContextMenuRouteLogic.mjs did not load");
        }

        Qt.quit();
    }
}
