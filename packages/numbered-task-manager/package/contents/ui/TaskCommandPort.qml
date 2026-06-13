// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    id: root

    property var taskModel

    function supportsContextMenuTaskRequest(requestMethod) {
        switch (requestMethod) {
        case "requestNewInstance":
        case "requestMove":
        case "requestResize":
        case "requestToggleMinimized":
        case "requestToggleMaximized":
        case "requestToggleKeepAbove":
        case "requestToggleKeepBelow":
        case "requestToggleFullScreen":
        case "requestToggleShaded":
        case "requestToggleNoBorder":
        case "requestToggleExcludeFromCapture":
        case "requestClose":
        case "requestActivities":
        case "requestVirtualDesktops":
        case "requestNewVirtualDesktop":
            return typeof taskModel[requestMethod] === "function";
        default:
            return false;
        }
    }

    function requestNewInstance(modelIndex) {
        taskModel.requestNewInstance(modelIndex);
    }

    function requestMove(modelIndex) {
        taskModel.requestMove(modelIndex);
    }

    function requestResize(modelIndex) {
        taskModel.requestResize(modelIndex);
    }

    function requestToggleMinimized(modelIndex) {
        taskModel.requestToggleMinimized(modelIndex);
    }

    function requestToggleMaximized(modelIndex) {
        taskModel.requestToggleMaximized(modelIndex);
    }

    function requestToggleKeepAbove(modelIndex) {
        taskModel.requestToggleKeepAbove(modelIndex);
    }

    function requestToggleKeepBelow(modelIndex) {
        taskModel.requestToggleKeepBelow(modelIndex);
    }

    function requestToggleFullScreen(modelIndex) {
        taskModel.requestToggleFullScreen(modelIndex);
    }

    function requestToggleShaded(modelIndex) {
        taskModel.requestToggleShaded(modelIndex);
    }

    function requestToggleNoBorder(modelIndex) {
        taskModel.requestToggleNoBorder(modelIndex);
    }

    function requestToggleExcludeFromCapture(modelIndex) {
        taskModel.requestToggleExcludeFromCapture(modelIndex);
    }

    function requestClose(modelIndex) {
        taskModel.requestClose(modelIndex);
    }

    function requestActivities(modelIndex, activities) {
        taskModel.requestActivities(modelIndex, activities);
    }

    function requestVirtualDesktops(modelIndex, virtualDesktops) {
        taskModel.requestVirtualDesktops(modelIndex, virtualDesktops);
    }

    function requestNewVirtualDesktop(modelIndex) {
        taskModel.requestNewVirtualDesktop(modelIndex);
    }
}
