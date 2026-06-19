// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { assignErrorContext } from "./ErrorContextLogic.mjs";

export function contextMenuFooterAction(action, plasmaAction) {
  const footerAction = plasmaAction || {};
  return {
    action: String(action || "contextMenuFooterAction"),
    enabled: Boolean(plasmaAction && footerAction.enabled),
    icon: plasmaAction && footerAction.icon ? String(footerAction.icon) : "",
    kind: "context-menu-footer-action",
    text: plasmaAction && footerAction.text ? String(footerAction.text) : "",
    visible: Boolean(plasmaAction && footerAction.visible),
  };
}

export function contextMenuFooterSection(configureAction, editModeAction) {
  return {
    visible: Boolean(configureAction?.visible || editModeAction?.visible),
  };
}

export function contextMenuFooterActionContext(actionState) {
  const state = actionState || {};
  return {
    footerActionKind: String(state.kind || ""),
  };
}

export function contextMenuFooterActionResult(actionState, code, error) {
  const state = actionState || {};
  const resultCode = code || "triggered";
  const context = contextMenuFooterActionContext(state);
  if (error !== undefined) {
    assignErrorContext(context, error);
  }

  return actionResult(
    state.action || "contextMenuFooterAction",
    resultCode,
    resultCode === "triggered",
    resultCode !== "triggered",
    context,
  );
}

export function executeContextMenuFooterAction(actionState, plasmaAction) {
  if (!plasmaAction) {
    return contextMenuFooterActionResult(actionState, "missing-footer-action");
  }
  if (typeof plasmaAction.trigger !== "function") {
    return contextMenuFooterActionResult(actionState, "missing-trigger-method");
  }

  try {
    const triggered = plasmaAction.trigger();
    if (triggered === false) {
      return contextMenuFooterActionResult(actionState, "trigger-rejected");
    }
  } catch (error) {
    return contextMenuFooterActionResult(actionState, "trigger-threw", error);
  }

  return contextMenuFooterActionResult(actionState, "triggered");
}
