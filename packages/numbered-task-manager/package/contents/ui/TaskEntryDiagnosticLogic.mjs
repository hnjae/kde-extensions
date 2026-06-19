// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";

export function taskEntryDiagnosticResult(diagnostic) {
  const entryDiagnostic = diagnostic || {};
  return actionResult(
    "projectTaskEntry",
    entryDiagnostic.code || "invalid-task-entry",
    false,
    true,
    Object.assign(
      {
        field: entryDiagnostic.field || "",
      },
      entryDiagnostic.context || {},
    ),
  );
}
