// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskEntryLogic.js");
Qt.include("VisibleTaskItemsLogic.js");

function normalizedStringList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter((entry) => entry && entry.length > 0);
}

function actionResult(action, code, ok, diagnostic, context) {
  return {
    action,
    code,
    context: Object.assign({}, context || {}),
    diagnostic: Boolean(diagnostic),
    ok: Boolean(ok),
  };
}

function actionErrorMessage(error) {
  if (error?.message) {
    return String(error.message);
  }

  return String(error);
}

function taskContext(task, options) {
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

function hasActivationSourceIndex(task) {
  const entry = task || {};
  return !(entry.sourceIndex === undefined || entry.sourceIndex < 0);
}

function rejectedActivation(action, code, diagnostic, task, options) {
  return actionResult(
    action,
    code,
    false,
    diagnostic,
    taskContext(task, options),
  );
}

function taskActivationRequest(action, task, options) {
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

  if (!hasValidModelIndex(entry.modelIndex)) {
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

function shortcutActivationOptions(targetItem, shortcutIndex) {
  const item = targetItem || {};
  const kind = item.kind || "";

  return {
    requireSourceIndex: kind === "normal",
    shortcutIndex,
    sourceModel: item.sourceModel || kind,
    targetKind: kind,
  };
}

function shortcutActivationRequest(visibleItems, shortcutIndex) {
  const targetItem = activationTargetForShortcutIndex(
    visibleItems,
    shortcutIndex,
  );
  if (!targetItem) {
    return actionResult("activateShortcut", "no-target", false, false, {
      shortcutIndex,
    });
  }

  if (targetItem.kind !== "normal" && targetItem.kind !== "remoteAttention") {
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

  return taskActivationRequest(
    "activateShortcut",
    targetItem.entry,
    shortcutActivationOptions(targetItem, shortcutIndex),
  );
}

function contextMenuRequestContext(request) {
  const menuRequest = request || {};
  const task = menuRequest.task || {};
  const visualParent = menuRequest.visualParent || {};

  return {
    entryKey: task.entryKey || "",
    modelIndexValid: hasValidModelIndex(menuRequest.modelIndex),
    title: task.title || "",
    visualParentWidth: visualParent.width || 0,
  };
}

function contextMenuRequestResult(request) {
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

  if (!menuRequest.taskModel) {
    return actionResult(
      "openContextMenu",
      "missing-task-model",
      false,
      true,
      context,
    );
  }

  if (!hasValidModelIndex(menuRequest.modelIndex)) {
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
      taskModel: menuRequest.taskModel,
      visualParent: menuRequest.visualParent,
      visualParentWidth: context.visualParentWidth,
    },
  );
}

function contextMenuCreationResult(menu, requestResult) {
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

function contextMenuLauncherCommand(action, value) {
  const commandAction = String(action || "");
  const command = {
    action: commandAction,
    kind: "launcher-command",
    launcherUrl: "",
    launchers: [],
  };

  if (commandAction === "replaceLauncherList") {
    command.launchers = normalizedStringList(value);
    return command;
  }

  command.launcherUrl = String(value || "");
  return command;
}

function normalizedContextMenuLauncherCommand(command) {
  const launcherCommand = command || {};
  if (launcherCommand.action === "replaceLauncherList") {
    return contextMenuLauncherCommand(
      launcherCommand.action,
      launcherCommand.launchers,
    );
  }

  return contextMenuLauncherCommand(
    launcherCommand.action,
    launcherCommand.launcherUrl,
  );
}

function contextMenuLauncherCommandDispatchResult(command) {
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

function contextMenuTaskRequestContext(modelIndex, task) {
  const entry = task || {};
  const context = {
    modelIndexValid: hasValidModelIndex(modelIndex),
  };

  if (entry.entryKey) {
    context.entryKey = entry.entryKey;
  }
  if (entry.title) {
    context.title = entry.title;
  }

  return context;
}

function contextMenuTaskCommand(requestMethod, argument) {
  const command = {
    arguments: [],
    kind: "task-model-request",
    requestMethod: String(requestMethod || ""),
  };

  if (argument !== undefined) {
    command.arguments = [argument];
  }

  return command;
}

function normalizedContextMenuTaskCommand(command) {
  if (typeof command === "string") {
    return contextMenuTaskCommand(command);
  }

  const taskCommand = command || {};
  return {
    arguments: Array.from(taskCommand.arguments || []),
    kind: taskCommand.kind || "task-model-request",
    requestMethod: String(taskCommand.requestMethod || ""),
  };
}

function contextMenuTaskRequest(command, taskModel, modelIndex, task) {
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

  if (!hasValidModelIndex(modelIndex)) {
    return actionResult(
      requestAction,
      "invalid-model-index",
      false,
      true,
      context,
    );
  }

  if (typeof taskModel[requestAction] !== "function") {
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

function contextMenuTaskExecutionResult(requestResult, error) {
  const request = requestResult || {};
  const requestMethod =
    request.requestMethod || request.action || "taskRequest";
  const context = Object.assign({}, request.context || {});

  if (!request.ok) {
    return request;
  }

  if (error !== undefined && error !== null) {
    context.error = actionErrorMessage(error);
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

function launcherMutationContext(launcherUrl) {
  const url = String(launcherUrl || "");
  return url ? { launcherUrl: url } : {};
}

function launcherMutationRequest(action, launcherUrl) {
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

function launcherMutationResult(requestResult, accepted) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  const context = launcherMutationContext(
    request.launcherUrl || request.context?.launcherUrl,
  );
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

function dragMoveRejectionDiagnostic(reason) {
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

function dragMoveRejectionResult(moveDecision, sourceIndex, targetIndex) {
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

function shouldLogActionResult(result) {
  return Boolean(result && !result.ok && result.diagnostic);
}
