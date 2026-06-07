// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskEntryLogic.js");
Qt.include("TaskScopeLogic.js");

function createNormalTaskEntry(roles) {
  const taskRoles = roles || {};
  const baseEntry = createBaseTaskEntry(taskRoles, normalTaskIconFallback());
  const launcherPinned = boolValue(taskRoles.launcherPinned);
  const isLauncher = boolValue(taskRoles.isLauncher);

  return Object.assign({}, baseEntry, {
    active: boolValue(taskRoles.active),
    canLaunchNewInstance: boolValue(
      taskRoles.canLaunchNewInstance || isLauncher,
    ),
    canSetNoBorder: boolValue(taskRoles.canSetNoBorder),
    closable: boolValue(taskRoles.closable),
    fullScreenable: boolValue(taskRoles.fullScreenable),
    hasLauncher: isLauncher || launcherPinned,
    hasNoBorder: boolValue(taskRoles.hasNoBorder),
    entryKey: stringValue(taskRoles.entryKey),
    isExcludedFromCapture: boolValue(taskRoles.isExcludedFromCapture),
    isFullScreen: boolValue(taskRoles.isFullScreen),
    isKeepAbove: boolValue(taskRoles.isKeepAbove),
    isKeepBelow: boolValue(taskRoles.isKeepBelow),
    isLauncher,
    isMaximizable: boolValue(taskRoles.isMaximizable),
    isMaximized: boolValue(taskRoles.isMaximized),
    isMinimizable: boolValue(taskRoles.isMinimizable),
    isMinimized: boolValue(taskRoles.isMinimized),
    isMovable: boolValue(taskRoles.isMovable),
    isResizable: boolValue(taskRoles.isResizable),
    isShadeable: boolValue(taskRoles.isShadeable),
    isShaded: boolValue(taskRoles.isShaded),
    isStartup: boolValue(taskRoles.isStartup),
    isVirtualDesktopsChangeable: boolValue(
      taskRoles.isVirtualDesktopsChangeable,
    ),
    launcherBacked: false,
    launcherPosition: numberValue(taskRoles.launcherPosition, -1),
    moveIndex: baseEntry.index,
    sourceIndex: baseEntry.index,
  });
}

function qualifiesNormalTask(task, isInCurrentActivity, currentDesktop) {
  return normalTaskQualifies(task, isInCurrentActivity, currentDesktop);
}

function normalTaskSourceOrder(left, right) {
  const leftIndex =
    left && left.sourceIndex !== undefined ? left.sourceIndex : -1;
  const rightIndex =
    right && right.sourceIndex !== undefined ? right.sourceIndex : -1;
  return leftIndex - rightIndex;
}

function normalTaskLauncherPosition(entry, visibleLauncherPosition) {
  if (!entry?.launcherUrl) {
    return -1;
  }

  if (entry.launcherPosition !== undefined) {
    return entry.launcherPosition;
  }

  if (typeof visibleLauncherPosition === "function") {
    return visibleLauncherPosition(entry.launcherUrl);
  }

  return -1;
}

function copyNormalTaskEntry(entry, launcherBacked, moveIndex) {
  const task = Object.assign({}, entry);
  task.launcherBacked = launcherBacked;
  task.moveIndex = moveIndex === undefined ? task.sourceIndex : moveIndex;
  return task;
}

function composeNormalTaskEntries(
  normalTaskEntryMap,
  normalTaskManualOrder,
  visibleLauncherPosition,
) {
  const entries = Object.keys(normalTaskEntryMap || {}).map(
    (key) => normalTaskEntryMap[key],
  );
  const launcherEntries = [];
  const taskEntries = [];
  const unpinnedByKey = {};

  for (let i = 0; i < entries.length; ++i) {
    const entry = entries[i];
    if (entry.isLauncher) {
      if (normalTaskLauncherPosition(entry, visibleLauncherPosition) !== -1) {
        launcherEntries.push(entry);
      }
    } else {
      taskEntries.push(entry);
    }
  }

  launcherEntries.sort((left, right) => {
    const positionDifference =
      normalTaskLauncherPosition(left, visibleLauncherPosition) -
      normalTaskLauncherPosition(right, visibleLauncherPosition);
    return positionDifference !== 0
      ? positionDifference
      : normalTaskSourceOrder(left, right);
  });
  taskEntries.sort(normalTaskSourceOrder);

  const pinnedEntries = [];
  const consumedKeys = {};
  for (let i = 0; i < launcherEntries.length; ++i) {
    const launcherEntry = launcherEntries[i];
    const launcherPosition = normalTaskLauncherPosition(
      launcherEntry,
      visibleLauncherPosition,
    );
    let representativeEntry = null;

    for (let j = 0; j < taskEntries.length; ++j) {
      const taskEntry = taskEntries[j];
      if (consumedKeys[taskEntry.entryKey]) {
        continue;
      }

      if (
        taskEntry.launcherUrl === launcherEntry.launcherUrl &&
        normalTaskLauncherPosition(taskEntry, visibleLauncherPosition) ===
          launcherPosition
      ) {
        representativeEntry = taskEntry;
        break;
      }
    }

    consumedKeys[launcherEntry.entryKey] = true;
    if (representativeEntry) {
      consumedKeys[representativeEntry.entryKey] = true;
    }

    const pinnedEntry = copyNormalTaskEntry(
      representativeEntry || launcherEntry,
      true,
      launcherEntry.sourceIndex,
    );
    pinnedEntry.launcherPosition = launcherPosition;
    pinnedEntry.pinnedLauncherUrl = launcherEntry.launcherUrl;
    pinnedEntries.push(pinnedEntry);
  }

  const unpinnedEntries = [];
  for (let i = 0; i < taskEntries.length; ++i) {
    const entry = taskEntries[i];
    if (!consumedKeys[entry.entryKey]) {
      unpinnedEntries.push(
        copyNormalTaskEntry(entry, false, entry.sourceIndex),
      );
    }
  }

  for (let i = 0; i < unpinnedEntries.length; ++i) {
    unpinnedByKey[unpinnedEntries[i].entryKey] = unpinnedEntries[i];
  }

  const orderedUnpinnedEntries = [];
  const nextManualOrder = [];
  const manualOrder = Array.from(normalTaskManualOrder || []);
  for (let i = 0; i < manualOrder.length; ++i) {
    const key = manualOrder[i];
    if (unpinnedByKey[key]) {
      orderedUnpinnedEntries.push(unpinnedByKey[key]);
      nextManualOrder.push(key);
      delete unpinnedByKey[key];
    }
  }

  for (let i = 0; i < unpinnedEntries.length; ++i) {
    const entry = unpinnedEntries[i];
    if (unpinnedByKey[entry.entryKey]) {
      orderedUnpinnedEntries.push(entry);
      nextManualOrder.push(entry.entryKey);
    }
  }

  return {
    entries: pinnedEntries.concat(orderedUnpinnedEntries),
    manualOrder: nextManualOrder,
  };
}

function normalTaskEntryMoveIndex(entry) {
  return entry.moveIndex === undefined ? entry.sourceIndex : entry.moveIndex;
}

function normalTaskEntryForSourceIndex(entries, sourceIndex) {
  const normalEntries = Array.from(entries || []);
  for (let i = 0; i < normalEntries.length; ++i) {
    if (normalTaskEntryMoveIndex(normalEntries[i]) === sourceIndex) {
      return normalEntries[i];
    }
  }

  return null;
}

function moveManualTaskOrder(entries, sourceKey, targetKey) {
  const order = Array.from(entries || [])
    .filter((entry) => !entry.launcherBacked)
    .map((entry) => entry.entryKey);
  const sourcePosition = order.indexOf(sourceKey);
  const targetPosition = order.indexOf(targetKey);
  if (
    sourcePosition === -1 ||
    targetPosition === -1 ||
    sourcePosition === targetPosition
  ) {
    return {
      moved: false,
      order,
    };
  }

  order.splice(sourcePosition, 1);
  order.splice(targetPosition, 0, sourceKey);
  return {
    moved: true,
    order,
  };
}

function canMoveTask(entries, sourceIndex, targetIndex, canMovePinnedLauncher) {
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return false;
  }

  const sourceEntry = normalTaskEntryForSourceIndex(entries, sourceIndex);
  const targetEntry = normalTaskEntryForSourceIndex(entries, targetIndex);
  if (!sourceEntry || !targetEntry) {
    return false;
  }

  if (
    Boolean(sourceEntry.launcherBacked) !== Boolean(targetEntry.launcherBacked)
  ) {
    return false;
  }

  if (sourceEntry.launcherBacked) {
    return (
      typeof canMovePinnedLauncher === "function" &&
      canMovePinnedLauncher(sourceEntry, targetEntry)
    );
  }

  return true;
}
