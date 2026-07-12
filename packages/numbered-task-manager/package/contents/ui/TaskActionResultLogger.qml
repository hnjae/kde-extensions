// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "ActionResultLogic.mjs" as ActionResultLogic

QtQuick.QtObject {
    property var warningSink: console

    function logActionResult(result) {
        if (!ActionResultLogic.shouldLogActionResult(result)) {
            return;
        }

        warningSink.warn("Numbered Task Manager action " + result.action + " " + result.code + ": " + JSON.stringify(result.context || {}));
    }
}
