// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    id: root

    property var taskModel

    function requestActivate(modelIndex) {
        taskModel.requestActivate(modelIndex);
    }
}
