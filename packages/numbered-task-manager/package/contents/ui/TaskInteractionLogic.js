// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function taskDragMimeData(dragMimeType, taskIndex) {
  const mimeType = String(dragMimeType || "");
  if (!mimeType) {
    return {};
  }

  const data = {};
  data[mimeType] = String(taskIndex);
  return data;
}

function taskDropSourceIndex(value) {
  if (value === undefined || value === null) {
    return -1;
  }

  const text = String(value);
  if (!text) {
    return -1;
  }

  const sourceIndex = Number(text);
  return Number.isNaN(sourceIndex) ? -1 : sourceIndex;
}

function canAcceptTaskDrop(sourceIndex, targetIndex, canDropTask) {
  if (sourceIndex < 0 || sourceIndex === targetIndex) {
    return false;
  }

  if (typeof canDropTask !== "function") {
    return false;
  }

  return Boolean(canDropTask(sourceIndex, targetIndex));
}

function taskContextMenuRequest(modelIndex, taskData, visualParent) {
  return {
    modelIndex,
    task: taskData || {},
    visualParent,
  };
}
