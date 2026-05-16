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

function isRemoteVirtualDesktop(desktops, isOnAllDesktops, currentDesktop) {
  if (isOnAllDesktops) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  return (
    desktopList.length > 0 && !desktopListContains(desktopList, currentDesktop)
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
