// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick as QtQuick

QtQuick.Item {
    id: root

    readonly property string targetPath: Qt.application.arguments.length > 1 ? Qt.application.arguments[Qt.application.arguments.length - 1] : ""

    visible: false

    QtQuick.Component.onCompleted: {
        if (!targetPath) {
            Qt.exit(2);
        }
    }

    QtQuick.Loader {
        source: root.targetPath

        onStatusChanged: {
            if (status === QtQuick.Loader.Ready) {
                Qt.callLater(Qt.quit);
            } else if (status === QtQuick.Loader.Error) {
                Qt.exit(1);
            }
        }
    }
}
