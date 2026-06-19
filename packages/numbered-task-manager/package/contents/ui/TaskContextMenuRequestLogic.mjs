// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { isActionableModelIndex } from "./TaskEntryLogic.mjs";

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
