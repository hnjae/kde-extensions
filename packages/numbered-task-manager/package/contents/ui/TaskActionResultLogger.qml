// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskActionLogic.mjs" as TaskActionLogic

QtQuick.QtObject {
    function logActionResult(result) {
        if (!TaskActionLogic.shouldLogActionResult(result)) {
            return;
        }

        console.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }
}
