// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { assignErrorContext } from "./ErrorContextLogic.mjs";
import { isActionableModelIndex } from "./TaskEntryLogic.mjs";
import {
  activationTargetForShortcutIndex,
  isNormalVisibleItem,
  isRemoteAttentionVisibleItem,
  validateVisibleItemDescriptor,
} from "./VisibleTaskItemsLogic.mjs";

export function taskContext(task, options) {
  const entry = task || {};
  const requestOptions = options || {};
  const context = {};

  if (entry.entryKey) {
    context.entryKey = entry.entryKey;
  }
  if (requestOptions.requireSourceIndex !== undefined) {
    context.requireSourceIndex = Boolean(requestOptions.requireSourceIndex);
  }
  if (entry.sourceIndex !== undefined) {
    context.sourceIndex = entry.sourceIndex;
  }
  if (requestOptions.shortcutIndex !== undefined) {
    context.shortcutIndex = requestOptions.shortcutIndex;
  }
  if (requestOptions.sourceModel) {
    context.sourceModel = requestOptions.sourceModel;
  }
  if (requestOptions.targetKind) {
    context.targetKind = requestOptions.targetKind;
  }
  if (entry.title) {
    context.title = entry.title;
  }

  return context;
}

export function hasActivationSourceIndex(task) {
  const entry = task || {};
  return !(entry.sourceIndex === undefined || entry.sourceIndex < 0);
}

export function rejectedActivation(action, code, diagnostic, task, options) {
  return actionResult(
    action,
    code,
    false,
    diagnostic,
    taskContext(task, options),
  );
}

export function taskActivationRequest(action, task, options) {
  const entry = task || null;
  const requestOptions = options || {};
  const requestAction = action || "activateTask";

  if (!entry) {
    return rejectedActivation(
      requestAction,
      "missing-task",
      false,
      entry,
      requestOptions,
    );
  }

  if (requestOptions.requireSourceIndex && !hasActivationSourceIndex(entry)) {
    return rejectedActivation(
      requestAction,
      "invalid-source-index",
      true,
      entry,
      requestOptions,
    );
  }

  if (!isActionableModelIndex(entry.modelIndex)) {
    return rejectedActivation(
      requestAction,
      "invalid-model-index",
      true,
      entry,
      requestOptions,
    );
  }

  return Object.assign(
    actionResult(
      requestAction,
      "ready",
      true,
      false,
      taskContext(entry, requestOptions),
    ),
    {
      modelIndex: entry.modelIndex,
      sourceModel: requestOptions.sourceModel || "",
    },
  );
}

export function activationExecutionContext(requestResult) {
  const request = requestResult || {};
  const context = Object.assign({}, request.context || {});

  if (context.modelIndexValid === undefined) {
    context.modelIndexValid = isActionableModelIndex(request.modelIndex);
  }
  if (request.sourceModel && !context.sourceModel) {
    context.sourceModel = request.sourceModel;
  }

  return context;
}

export function activationExecutionResult(
  requestResult,
  activationTarget,
  error,
) {
  const request = requestResult || {};
  const requestAction = request.action || "activateTask";

  if (!request.ok) {
    return request;
  }

  const context = activationExecutionContext(request);
  if (!activationTarget) {
    return actionResult(
      requestAction,
      "missing-activation-target",
      false,
      true,
      context,
    );
  }

  if (typeof activationTarget.requestActivate !== "function") {
    return actionResult(
      requestAction,
      "missing-request-activate",
      false,
      true,
      context,
    );
  }

  if (error !== undefined && error !== null) {
    assignErrorContext(context, error);
    return actionResult(requestAction, "request-threw", false, true, context);
  }

  return actionResult(requestAction, "executed", true, false, context);
}

export function shortcutActivationOptions(targetItem, shortcutIndex) {
  const item = targetItem || {};
  const kind = item.kind || "";

  return {
    requireSourceIndex: isNormalVisibleItem(item),
    shortcutIndex,
    sourceModel: item.sourceModel || kind,
    targetKind: kind,
  };
}

export function shortcutActivationRequest(visibleItems, shortcutIndex) {
  const targetItem = activationTargetForShortcutIndex(
    visibleItems,
    shortcutIndex,
  );
  if (!targetItem) {
    return actionResult("activateShortcut", "no-target", false, false, {
      shortcutIndex,
    });
  }

  if (
    !isNormalVisibleItem(targetItem) &&
    !isRemoteAttentionVisibleItem(targetItem)
  ) {
    return actionResult(
      "activateShortcut",
      "unsupported-target-kind",
      false,
      true,
      {
        shortcutIndex,
        sourceModel: targetItem.sourceModel || "",
        targetKind: targetItem.kind || "",
      },
    );
  }

  const validation = validateVisibleItemDescriptor(targetItem);
  if (!validation.ok) {
    return actionResult(
      "activateShortcut",
      "invalid-visible-item",
      false,
      true,
      Object.assign(
        {
          shortcutIndex,
          validationCode: validation.code || "",
        },
        validation.context || {},
      ),
    );
  }

  return taskActivationRequest(
    "activateShortcut",
    targetItem.entry,
    shortcutActivationOptions(targetItem, shortcutIndex),
  );
}
