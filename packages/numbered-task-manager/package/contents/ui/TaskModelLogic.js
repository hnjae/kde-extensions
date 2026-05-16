// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function desktopId(desktop) {
  if (!desktop) {
    return "";
  }

  if (typeof desktop === "string") {
    return desktop;
  }

  if (desktop.id) {
    return String(desktop.id);
  }

  return String(desktop);
}

function desktopListContains(desktops, desktop) {
  const currentDesktopId = desktopId(desktop);
  if (!currentDesktopId) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  for (let i = 0; i < desktopList.length; ++i) {
    if (desktopId(desktopList[i]) === currentDesktopId) {
      return true;
    }
  }

  return false;
}

function isOnCurrentVirtualDesktop(desktops, isOnAllDesktops, currentDesktop) {
  if (isOnAllDesktops) {
    return true;
  }

  return desktopListContains(desktops, currentDesktop);
}

function isRemoteVirtualDesktop(desktops, isOnAllDesktops, currentDesktop) {
  if (isOnAllDesktops) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  return (
    desktopList.length > 0 && !desktopListContains(desktopList, currentDesktop)
  );
}

function hasValidModelIndex(modelIndex) {
  return (
    Boolean(modelIndex) && (modelIndex.valid === undefined || modelIndex.valid)
  );
}

function boolValue(value) {
  return Boolean(value);
}

function stringValue(value) {
  return String(value || "");
}

function numberValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const numericValue = Number(value);
  return isNaN(numericValue) ? fallback : numericValue;
}

function taskTitle(display, appName) {
  return stringValue(display || appName);
}

function taskIconSource(decoration, fallback) {
  return decoration || fallback;
}

function createNormalTaskEntry(roles) {
  const taskRoles = roles || {};
  const index = numberValue(taskRoles.index, -1);
  const launcherPinned = boolValue(taskRoles.launcherPinned);
  const isLauncher = boolValue(taskRoles.isLauncher);
  const hasLauncher = boolValue(taskRoles.hasLauncher);

  return {
    activities: Array.from(taskRoles.activities || []),
    active: boolValue(taskRoles.active),
    canLaunchNewInstance: boolValue(
      taskRoles.canLaunchNewInstance || isLauncher,
    ),
    canSetNoBorder: boolValue(taskRoles.canSetNoBorder),
    closable: boolValue(taskRoles.closable),
    demandingAttention: boolValue(taskRoles.demandingAttention),
    fullScreenable: boolValue(taskRoles.fullScreenable),
    hasAnyLauncher: hasLauncher || isLauncher || launcherPinned,
    hasLauncher: isLauncher || launcherPinned,
    hasNoBorder: boolValue(taskRoles.hasNoBorder),
    iconSource: taskIconSource(
      taskRoles.iconSource,
      "application-x-executable",
    ),
    index,
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
    isOnAllVirtualDesktops: boolValue(taskRoles.isOnAllVirtualDesktops),
    isResizable: boolValue(taskRoles.isResizable),
    isShadeable: boolValue(taskRoles.isShadeable),
    isShaded: boolValue(taskRoles.isShaded),
    isStartup: boolValue(taskRoles.isStartup),
    isVirtualDesktopsChangeable: boolValue(
      taskRoles.isVirtualDesktopsChangeable,
    ),
    isWindow: boolValue(taskRoles.isWindow),
    launcherBacked: false,
    launcherPosition: numberValue(taskRoles.launcherPosition, -1),
    launcherUrl: stringValue(taskRoles.launcherUrl),
    modelIndex: taskRoles.modelIndex,
    moveIndex: index,
    sourceIndex: index,
    title: taskTitle(taskRoles.display, taskRoles.appName),
    virtualDesktops: Array.from(taskRoles.virtualDesktops || []),
  };
}

function createRemoteAttentionEntry(roles) {
  const taskRoles = roles || {};
  const index = numberValue(taskRoles.index, -1);

  return {
    activities: Array.from(taskRoles.activities || []),
    demandingAttention: boolValue(taskRoles.demandingAttention),
    iconSource: taskIconSource(taskRoles.iconSource, "dialog-warning"),
    index,
    isOnAllVirtualDesktops: boolValue(taskRoles.isOnAllVirtualDesktops),
    isWindow: boolValue(taskRoles.isWindow),
    launcherUrl: stringValue(taskRoles.launcherUrl),
    modelIndex: taskRoles.modelIndex,
    title: taskTitle(taskRoles.display, taskRoles.appName),
    virtualDesktops: Array.from(taskRoles.virtualDesktops || []),
    winIds: Array.from(taskRoles.winIds || []),
  };
}

function qualifiesNormalTask(task, isInCurrentActivity, currentDesktop) {
  const entry = task || {};
  if (
    typeof isInCurrentActivity === "function" &&
    !isInCurrentActivity(entry.activities || [])
  ) {
    return false;
  }

  if (entry.isWindow) {
    return isOnCurrentVirtualDesktop(
      entry.virtualDesktops || [],
      entry.isOnAllVirtualDesktops,
      currentDesktop,
    );
  }

  return Boolean(entry.isLauncher || entry.isStartup);
}

function qualifiesRemoteAttention(task, isInCurrentActivity, currentDesktop) {
  const entry = task || {};
  return (
    Boolean(entry.isWindow) &&
    Boolean(entry.demandingAttention) &&
    (typeof isInCurrentActivity !== "function" ||
      isInCurrentActivity(entry.activities || [])) &&
    isRemoteVirtualDesktop(
      entry.virtualDesktops || [],
      entry.isOnAllVirtualDesktops,
      currentDesktop,
    )
  );
}

function normalTaskSourceOrder(left, right) {
  const leftIndex =
    left && left.sourceIndex !== undefined ? left.sourceIndex : -1;
  const rightIndex =
    right && right.sourceIndex !== undefined ? right.sourceIndex : -1;
  return leftIndex - rightIndex;
}

function normalTaskLauncherPosition(entry, visibleLauncherPosition) {
  if (!entry || !entry.launcherUrl) {
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

function remoteAttentionKey(winIds, launcherUrl, title, row) {
  const windowIds = Array.from(winIds || []);
  if (windowIds.length > 0) {
    return "window:" + windowIds.join(",");
  }

  return "row:" + row.toString() + ":" + launcherUrl + ":" + title;
}

function remoteAttentionSnapshot(entryMap, order) {
  const entries = [];
  const attentionOrder = Array.from(order || []);
  const attentionEntryMap = entryMap || {};

  for (let i = 0; i < attentionOrder.length; ++i) {
    const key = attentionOrder[i];
    if (attentionEntryMap[key]) {
      entries.push(attentionEntryMap[key]);
    }
  }

  return {
    count: entries.length,
    entries,
    target: entries.length > 0 ? entries[entries.length - 1] : null,
  };
}

function publishRemoteAttention(
  entryMap,
  order,
  previousKey,
  key,
  qualifies,
  task,
  becameQualified,
) {
  const entries = Object.assign({}, entryMap || {});
  let nextOrder = Array.from(order || []);

  if (previousKey && previousKey !== key) {
    if (entries[previousKey]) {
      delete entries[previousKey];
      if (qualifies) {
        entries[key] = task;
        const replacedOrder = [];
        let inserted = false;
        for (let i = 0; i < nextOrder.length; ++i) {
          const existingKey = nextOrder[i];
          if (existingKey === previousKey) {
            replacedOrder.push(key);
            inserted = true;
          } else if (existingKey !== key) {
            replacedOrder.push(existingKey);
          }
        }
        if (!inserted) {
          replacedOrder.push(key);
        }
        nextOrder = replacedOrder;
      } else {
        nextOrder = nextOrder.filter(
          (existingKey) => existingKey !== previousKey,
        );
      }
    }
  }

  if (!qualifies) {
    if (entries[key]) {
      delete entries[key];
    }
    nextOrder = nextOrder.filter((existingKey) => existingKey !== key);
    return {
      entryMap: entries,
      order: nextOrder,
      publishedKey: "",
      snapshot: remoteAttentionSnapshot(entries, nextOrder),
    };
  }

  if (!entries[key]) {
    nextOrder = nextOrder
      .filter((existingKey) => existingKey !== key)
      .concat([key]);
  }
  entries[key] = task;
  if (becameQualified) {
    nextOrder = nextOrder
      .filter((existingKey) => existingKey !== key)
      .concat([key]);
  }

  return {
    entryMap: entries,
    order: nextOrder,
    publishedKey: key,
    snapshot: remoteAttentionSnapshot(entries, nextOrder),
  };
}

function removeRemoteAttention(entryMap, order, key) {
  const entries = Object.assign({}, entryMap || {});
  if (!key || !entries[key]) {
    return {
      entryMap: entries,
      order: Array.from(order || []),
      snapshot: remoteAttentionSnapshot(entries, order),
    };
  }

  delete entries[key];
  const nextOrder = Array.from(order || []).filter(
    (existingKey) => existingKey !== key,
  );
  return {
    entryMap: entries,
    order: nextOrder,
    snapshot: remoteAttentionSnapshot(entries, nextOrder),
  };
}
