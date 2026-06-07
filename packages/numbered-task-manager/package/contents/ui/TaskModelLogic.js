// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function createNormalTaskEntry(roles, taskEntryLogic) {
  const taskRoles = roles || {};
  const baseEntry = taskEntryLogic.createBaseTaskEntry(
    taskRoles,
    taskEntryLogic.normalTaskIconFallback(),
  );
  const launcherPinned = taskEntryLogic.boolValue(taskRoles.launcherPinned);
  const isLauncher = taskEntryLogic.boolValue(taskRoles.isLauncher);
  const hasLauncher = taskEntryLogic.boolValue(taskRoles.hasLauncher);

  return Object.assign({}, baseEntry, {
    active: taskEntryLogic.boolValue(taskRoles.active),
    canLaunchNewInstance: taskEntryLogic.boolValue(
      taskRoles.canLaunchNewInstance || isLauncher,
    ),
    canSetNoBorder: taskEntryLogic.boolValue(taskRoles.canSetNoBorder),
    closable: taskEntryLogic.boolValue(taskRoles.closable),
    fullScreenable: taskEntryLogic.boolValue(taskRoles.fullScreenable),
    hasAnyLauncher: hasLauncher || isLauncher || launcherPinned,
    hasLauncher: isLauncher || launcherPinned,
    hasNoBorder: taskEntryLogic.boolValue(taskRoles.hasNoBorder),
    entryKey: taskEntryLogic.stringValue(taskRoles.entryKey),
    isExcludedFromCapture: taskEntryLogic.boolValue(
      taskRoles.isExcludedFromCapture,
    ),
    isFullScreen: taskEntryLogic.boolValue(taskRoles.isFullScreen),
    isKeepAbove: taskEntryLogic.boolValue(taskRoles.isKeepAbove),
    isKeepBelow: taskEntryLogic.boolValue(taskRoles.isKeepBelow),
    isLauncher,
    isMaximizable: taskEntryLogic.boolValue(taskRoles.isMaximizable),
    isMaximized: taskEntryLogic.boolValue(taskRoles.isMaximized),
    isMinimizable: taskEntryLogic.boolValue(taskRoles.isMinimizable),
    isMinimized: taskEntryLogic.boolValue(taskRoles.isMinimized),
    isMovable: taskEntryLogic.boolValue(taskRoles.isMovable),
    isResizable: taskEntryLogic.boolValue(taskRoles.isResizable),
    isShadeable: taskEntryLogic.boolValue(taskRoles.isShadeable),
    isShaded: taskEntryLogic.boolValue(taskRoles.isShaded),
    isStartup: taskEntryLogic.boolValue(taskRoles.isStartup),
    isVirtualDesktopsChangeable: taskEntryLogic.boolValue(
      taskRoles.isVirtualDesktopsChangeable,
    ),
    launcherBacked: false,
    launcherPosition: taskEntryLogic.numberValue(
      taskRoles.launcherPosition,
      -1,
    ),
    moveIndex: baseEntry.index,
    sourceIndex: baseEntry.index,
  });
}

function qualifiesNormalTask(
  task,
  isInCurrentActivity,
  currentDesktop,
  taskEntryLogic,
) {
  const entry = task || {};
  if (
    typeof isInCurrentActivity === "function" &&
    !isInCurrentActivity(entry.activities || [])
  ) {
    return false;
  }

  if (entry.isWindow) {
    return taskEntryLogic.isOnCurrentVirtualDesktop(
      entry.virtualDesktops || [],
      entry.isOnAllVirtualDesktops,
      currentDesktop,
    );
  }

  return Boolean(entry.isLauncher || entry.isStartup);
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
