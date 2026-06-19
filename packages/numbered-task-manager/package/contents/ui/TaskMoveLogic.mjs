// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";

export function dragMoveRejectionDiagnostic(reason) {
  const expectedReasons = [
    "same-index",
    "boundary-crossing",
    "pinned-launcher-denied",
  ];
  for (let i = 0; i < expectedReasons.length; ++i) {
    if (expectedReasons[i] === reason) {
      return false;
    }
  }

  return true;
}

export function dragMoveRejectionResult(
  moveDecision,
  sourceIndex,
  targetIndex,
) {
  const decision = moveDecision || {};
  const reason = String(decision.reason || "");
  const context = {
    reason: reason || "unknown-rejection",
    sourceIndex,
    targetIndex,
  };

  if (decision.canMove) {
    return actionResult("dragMoveTask", "accepted", true, false, context);
  }

  return actionResult(
    "dragMoveTask",
    context.reason,
    false,
    dragMoveRejectionDiagnostic(context.reason),
    context,
  );
}
