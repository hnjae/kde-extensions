// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "TaskEntryDiagnosticLogic.mjs" as TaskEntryDiagnosticLogic
import "TaskEntryLogic.mjs" as TaskEntryLogic

QtQuick.QtObject {
    id: root

    property string sourceModel: ""
    property int sourceRow: -1
    property string publicationKey: ""
    property var roles: ({})
    property string lastDiagnosticSignature: ""

    signal actionResult(var result)

    function diagnosticContext() {
        const context = {
            sourceModel: root.sourceModel,
            sourceRow: root.sourceRow
        };
        if (root.publicationKey) {
            context.publicationKey = root.publicationKey;
        }
        return context;
    }

    function emitDiagnostics() {
        const diagnostics = TaskEntryLogic.taskEntryDiagnostics(root.roles, diagnosticContext());
        const signature = JSON.stringify(diagnostics);
        if (signature === root.lastDiagnosticSignature) {
            return;
        }

        root.lastDiagnosticSignature = signature;
        for (let i = 0; i < diagnostics.length; ++i) {
            root.actionResult(TaskEntryDiagnosticLogic.taskEntryDiagnosticResult(diagnostics[i]));
        }
    }
}
