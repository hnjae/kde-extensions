// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { assignErrorContext } from "./ErrorContextLogic.mjs";
import { normalizedContextMenuTaskCommand } from "./TaskContextMenuCommandLogic.mjs";
import { isActionableModelIndex } from "./TaskEntryLogic.mjs";

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
