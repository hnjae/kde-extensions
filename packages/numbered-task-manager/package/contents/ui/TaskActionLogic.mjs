// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isActionableModelIndex } from "./TaskEntryLogic.mjs";
import {
  normalizedContextMenuLauncherCommand,
  normalizedContextMenuTaskCommand,
} from "./TaskContextMenuCommandLogic.mjs";
import { assignErrorContext } from "./ErrorContextLogic.mjs";
import {
  activationTargetForShortcutIndex,
  isNormalVisibleItem,
  isRemoteAttentionVisibleItem,
  validateVisibleItemDescriptor,
} from "./VisibleTaskItemsLogic.mjs";

export function normalizedStringList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter((entry) => entry && entry.length > 0);
}

export function actionResult(action, code, ok, diagnostic, context) {
  return {
    action,
    code,
    context: Object.assign({}, context || {}),
    diagnostic: Boolean(diagnostic),
    ok: Boolean(ok),
  };
}

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

export function contextMenuRequestContext(request) {
  const menuRequest = request || {};
  const task = menuRequest.task || {};
  const visualParent = menuRequest.visualParent || {};

  return {
    entryKey: task.entryKey || "",
    modelIndexValid: isActionableModelIndex(menuRequest.modelIndex),
    title: task.title || "",
    visualParentWidth: visualParent.width || 0,
  };
}

export function contextMenuRequestResult(request) {
  const menuRequest = request || {};
  const context = contextMenuRequestContext(menuRequest);

  if (!menuRequest.visualParent) {
    return actionResult(
      "openContextMenu",
      "missing-visual-parent",
      false,
      true,
      context,
    );
  }

  if (!menuRequest.taskRolePort) {
    return actionResult(
      "openContextMenu",
      "missing-task-role-port",
      false,
      true,
      context,
    );
  }

  if (!isActionableModelIndex(menuRequest.modelIndex)) {
    return actionResult(
      "openContextMenu",
      "invalid-model-index",
      false,
      true,
      context,
    );
  }

  return Object.assign(
    actionResult("openContextMenu", "ready", true, false, context),
    {
      modelIndex: menuRequest.modelIndex,
      task: menuRequest.task || {},
      taskRolePort: menuRequest.taskRolePort,
      visualParent: menuRequest.visualParent,
      visualParentWidth: context.visualParentWidth,
    },
  );
}

export function contextMenuCreationResult(menu, requestResult) {
  if (menu) {
    return actionResult("openContextMenu", "created", true, false, {});
  }

  const result = requestResult || {};
  return actionResult(
    "openContextMenu",
    "create-failed",
    false,
    true,
    result.context || {},
  );
}

export function contextMenuActionDispatchContext(route) {
  const actionRoute = route || {};
  const command = actionRoute.command || {};
  const update = actionRoute.update || {};
  const context = {
    routeKind: String(actionRoute.kind || ""),
  };

  if (command.action) {
    context.commandAction = String(command.action);
  }
  if (command.launcherUrl) {
    context.launcherUrl = String(command.launcherUrl);
  }
  if (command.requestMethod) {
    context.requestMethod = String(command.requestMethod);
  }
  if (update.reason) {
    context.reason = String(update.reason);
  }

  return context;
}

export function contextMenuActionDispatchFailure(route, code) {
  return actionResult(
    "dispatchContextMenuAction",
    code || "dispatch-failed",
    false,
    true,
    contextMenuActionDispatchContext(route),
  );
}

export function contextMenuLauncherCommandDispatchResult(command) {
  const launcherCommand = normalizedContextMenuLauncherCommand(command);
  const context = {};
  if (launcherCommand.launcherUrl) {
    context.launcherUrl = launcherCommand.launcherUrl;
  }
  if (launcherCommand.launchers.length > 0) {
    context.launchers = launcherCommand.launchers;
  }

  if (
    launcherCommand.action !== "pinLauncher" &&
    launcherCommand.action !== "unpinLauncher" &&
    launcherCommand.action !== "replaceLauncherList"
  ) {
    context.commandKind = launcherCommand.kind;
    return Object.assign(
      actionResult(
        launcherCommand.action || "launcherCommand",
        "unknown-launcher-command",
        false,
        true,
        context,
      ),
      launcherCommand,
    );
  }

  return Object.assign(
    actionResult(launcherCommand.action, "ready", true, false, context),
    launcherCommand,
  );
}

export function contextMenuLauncherActivityContext(update, launcherUrl) {
  const activityUpdate = update || {};
  const context = {};
  const url = String(launcherUrl || "");

  if (url) {
    context.launcherUrl = url;
  }
  if (activityUpdate.changed !== undefined) {
    context.changed = Boolean(activityUpdate.changed);
  }
  if (activityUpdate.reason) {
    context.reason = String(activityUpdate.reason);
  }

  return context;
}

export function contextMenuLauncherActivityResult(update, code, launcherUrl) {
  return actionResult(
    "updateLauncherActivities",
    code || "launcher-activity-update-failed",
    false,
    true,
    contextMenuLauncherActivityContext(update, launcherUrl),
  );
}

export function contextMenuTaskRequestContext(modelIndex, task) {
  const entry = task || {};
  const context = {
    modelIndexValid: isActionableModelIndex(modelIndex),
  };

  if (entry.entryKey) {
    context.entryKey = entry.entryKey;
  }
  if (entry.title) {
    context.title = entry.title;
  }

  return context;
}

export function isSupportedContextMenuTaskRequestMethod(requestMethod) {
  switch (requestMethod) {
    case "requestNewInstance":
    case "requestMove":
    case "requestResize":
    case "requestToggleMinimized":
    case "requestToggleMaximized":
    case "requestToggleKeepAbove":
    case "requestToggleKeepBelow":
    case "requestToggleFullScreen":
    case "requestToggleShaded":
    case "requestToggleNoBorder":
    case "requestToggleExcludeFromCapture":
    case "requestClose":
    case "requestActivities":
    case "requestVirtualDesktops":
    case "requestNewVirtualDesktop":
      return true;
    default:
      return false;
  }
}

export function hasContextMenuTaskRequestMethod(taskModel, requestMethod) {
  if (!taskModel) {
    return false;
  }

  if (typeof taskModel.supportsContextMenuTaskRequest === "function") {
    return taskModel.supportsContextMenuTaskRequest(requestMethod);
  }

  switch (requestMethod) {
    case "requestNewInstance":
      return typeof taskModel.requestNewInstance === "function";
    case "requestMove":
      return typeof taskModel.requestMove === "function";
    case "requestResize":
      return typeof taskModel.requestResize === "function";
    case "requestToggleMinimized":
      return typeof taskModel.requestToggleMinimized === "function";
    case "requestToggleMaximized":
      return typeof taskModel.requestToggleMaximized === "function";
    case "requestToggleKeepAbove":
      return typeof taskModel.requestToggleKeepAbove === "function";
    case "requestToggleKeepBelow":
      return typeof taskModel.requestToggleKeepBelow === "function";
    case "requestToggleFullScreen":
      return typeof taskModel.requestToggleFullScreen === "function";
    case "requestToggleShaded":
      return typeof taskModel.requestToggleShaded === "function";
    case "requestToggleNoBorder":
      return typeof taskModel.requestToggleNoBorder === "function";
    case "requestToggleExcludeFromCapture":
      return typeof taskModel.requestToggleExcludeFromCapture === "function";
    case "requestClose":
      return typeof taskModel.requestClose === "function";
    case "requestActivities":
      return typeof taskModel.requestActivities === "function";
    case "requestVirtualDesktops":
      return typeof taskModel.requestVirtualDesktops === "function";
    case "requestNewVirtualDesktop":
      return typeof taskModel.requestNewVirtualDesktop === "function";
    default:
      return false;
  }
}

export function contextMenuTaskRequest(command, taskModel, modelIndex, task) {
  const taskCommand = normalizedContextMenuTaskCommand(command);
  const requestAction = taskCommand.requestMethod || "taskRequest";
  const context = contextMenuTaskRequestContext(modelIndex, task);

  if (!taskModel) {
    return actionResult(
      requestAction,
      "missing-task-model",
      false,
      true,
      context,
    );
  }

  if (!isActionableModelIndex(modelIndex)) {
    return actionResult(
      requestAction,
      "invalid-model-index",
      false,
      true,
      context,
    );
  }

  if (!isSupportedContextMenuTaskRequestMethod(requestAction)) {
    return actionResult(
      requestAction,
      "unsupported-request-method",
      false,
      true,
      context,
    );
  }

  if (!hasContextMenuTaskRequestMethod(taskModel, requestAction)) {
    return actionResult(
      requestAction,
      "missing-request-method",
      false,
      true,
      context,
    );
  }

  return Object.assign(
    actionResult(requestAction, "ready", true, false, context),
    {
      modelIndex,
      requestArguments: taskCommand.arguments,
      requestMethod: requestAction,
    },
  );
}

export function executeContextMenuTaskRequest(requestResult, taskModel) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  try {
    const argument = Array.from(request.requestArguments || [])[0];
    switch (request.requestMethod) {
      case "requestNewInstance":
        taskModel.requestNewInstance(request.modelIndex);
        break;
      case "requestMove":
        taskModel.requestMove(request.modelIndex);
        break;
      case "requestResize":
        taskModel.requestResize(request.modelIndex);
        break;
      case "requestToggleMinimized":
        taskModel.requestToggleMinimized(request.modelIndex);
        break;
      case "requestToggleMaximized":
        taskModel.requestToggleMaximized(request.modelIndex);
        break;
      case "requestToggleKeepAbove":
        taskModel.requestToggleKeepAbove(request.modelIndex);
        break;
      case "requestToggleKeepBelow":
        taskModel.requestToggleKeepBelow(request.modelIndex);
        break;
      case "requestToggleFullScreen":
        taskModel.requestToggleFullScreen(request.modelIndex);
        break;
      case "requestToggleShaded":
        taskModel.requestToggleShaded(request.modelIndex);
        break;
      case "requestToggleNoBorder":
        taskModel.requestToggleNoBorder(request.modelIndex);
        break;
      case "requestToggleExcludeFromCapture":
        taskModel.requestToggleExcludeFromCapture(request.modelIndex);
        break;
      case "requestClose":
        taskModel.requestClose(request.modelIndex);
        break;
      case "requestActivities":
        taskModel.requestActivities(request.modelIndex, argument);
        break;
      case "requestVirtualDesktops":
        taskModel.requestVirtualDesktops(request.modelIndex, argument);
        break;
      case "requestNewVirtualDesktop":
        taskModel.requestNewVirtualDesktop(request.modelIndex);
        break;
      default:
        return actionResult(
          request.requestMethod || request.action || "taskRequest",
          "unsupported-request-method",
          false,
          true,
          request.context || {},
        );
    }
  } catch (error) {
    return contextMenuTaskExecutionResult(request, error);
  }

  return contextMenuTaskExecutionResult(request);
}

export function contextMenuTaskExecutionResult(requestResult, error) {
  const request = requestResult || {};
  const requestMethod =
    request.requestMethod || request.action || "taskRequest";
  const context = Object.assign({}, request.context || {});

  if (!request.ok) {
    return request;
  }

  if (error !== undefined && error !== null) {
    assignErrorContext(context, error);
    context.requestMethod = requestMethod;
    return Object.assign(
      actionResult(
        request.action || requestMethod,
        "request-threw",
        false,
        true,
        context,
      ),
      {
        requestMethod,
      },
    );
  }

  return Object.assign(
    actionResult(
      request.action || requestMethod,
      "executed",
      true,
      false,
      context,
    ),
    {
      requestMethod,
    },
  );
}

export function launcherMutationContext(launcherUrl) {
  const url = String(launcherUrl || "");
  return url ? { launcherUrl: url } : {};
}

export function launcherMutationRequest(action, launcherUrl) {
  const requestAction = action || "launcherMutation";
  const context = launcherMutationContext(launcherUrl);

  if (!context.launcherUrl) {
    return actionResult(
      requestAction,
      "missing-launcher-url",
      false,
      false,
      context,
    );
  }

  return Object.assign(
    actionResult(requestAction, "ready", true, false, context),
    {
      launcherUrl: context.launcherUrl,
    },
  );
}

export function launcherMutationResult(requestResult, accepted, error) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  const context = launcherMutationContext(
    request.launcherUrl || request.context?.launcherUrl,
  );
  if (error !== undefined && error !== null) {
    assignErrorContext(context, error);
    return Object.assign(
      actionResult(
        request.action || "launcherMutation",
        "request-threw",
        false,
        true,
        context,
      ),
      {
        launcherUrl: context.launcherUrl || "",
      },
    );
  }

  const code = accepted ? "accepted" : "request-rejected";
  return Object.assign(
    actionResult(
      request.action || "launcherMutation",
      code,
      accepted,
      !accepted,
      context,
    ),
    {
      launcherUrl: context.launcherUrl || "",
    },
  );
}

export function launcherMutationPersistenceResult(
  requestResult,
  persistResult,
) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  const persistence = persistResult || {};
  const context = Object.assign({}, request.context || {});
  if (request.launcherUrl) {
    context.launcherUrl = request.launcherUrl;
  }
  if (persistence.code) {
    context.syncCode = String(persistence.code);
  }
  const failedTargets = normalizedStringList(persistence.failedTargets);
  if (failedTargets.length > 0) {
    context.failedTargets = failedTargets;
  }
  const launchers = normalizedStringList(persistence.launchers);
  if (launchers.length > 0) {
    context.launchers = launchers;
  }
  const configLaunchers = normalizedStringList(persistence.configLaunchers);
  if (configLaunchers.length > 0) {
    context.configLaunchers = configLaunchers;
  }
  const modelLaunchers = normalizedStringList(persistence.modelLaunchers);
  if (modelLaunchers.length > 0) {
    context.modelLaunchers = modelLaunchers;
  }
  if (persistence.error !== undefined && persistence.error !== null) {
    assignErrorContext(context, persistence.error);
  }

  if (persistence.ok) {
    return Object.assign(
      actionResult(
        request.action || "launcherMutation",
        persistence.code || "launcher-persisted",
        true,
        false,
        context,
      ),
      {
        launcherUrl: context.launcherUrl || "",
      },
    );
  }

  return Object.assign(
    actionResult(
      request.action || "launcherMutation",
      persistence.code || "launcher-persistence-failed",
      false,
      true,
      context,
    ),
    {
      launcherUrl: context.launcherUrl || "",
    },
  );
}

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

export function shouldLogActionResult(result) {
  return Boolean(result && !result.ok && result.diagnostic);
}
