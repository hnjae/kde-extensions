// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick

QtQuick.QtObject {
    id: root

    property var remoteAttentionSource
    property var taskModel

    function requestActivation(result) {
        if (result.sourceModel === "remoteAttention") {
            remoteAttentionSource.requestActivate(result.modelIndex);
            return;
        }

        taskModel.requestActivate(result.modelIndex);
    }
}
