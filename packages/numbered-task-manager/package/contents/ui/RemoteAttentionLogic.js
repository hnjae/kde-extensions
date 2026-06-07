// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function createRemoteAttentionEntry(roles, taskEntryLogic) {
  const taskRoles = roles || {};

  return Object.assign(
    {},
    taskEntryLogic.createBaseTaskEntry(taskRoles, "dialog-warning"),
    {
      winIds: Array.from(taskRoles.winIds || []),
    },
  );
}

function qualifiesRemoteAttention(
  task,
  isInCurrentActivity,
  currentDesktop,
  taskEntryLogic,
) {
  const entry = task || {};
  return (
    Boolean(entry.isWindow) &&
    Boolean(entry.demandingAttention) &&
    (typeof isInCurrentActivity !== "function" ||
      isInCurrentActivity(entry.activities || [])) &&
    taskEntryLogic.isRemoteVirtualDesktop(
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

function remoteAttentionStateEntryMap(state) {
  return Object.assign({}, state?.entryMap || {});
}

function remoteAttentionStateOrder(state) {
  return Array.from(state?.order || []);
}

function remoteAttentionStateFromParts(entryMap, order) {
  const nextEntryMap = Object.assign({}, entryMap || {});
  const nextOrder = Array.from(order || []);
  const snapshot = remoteAttentionSnapshot(nextEntryMap, nextOrder);

  return {
    count: snapshot.count,
    entries: snapshot.entries,
    entryMap: nextEntryMap,
    order: nextOrder,
    target: snapshot.target,
  };
}

function createRemoteAttentionState() {
  return remoteAttentionStateFromParts({}, []);
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

function publishRemoteAttentionState(
  state,
  previousKey,
  key,
  qualifies,
  task,
  becameQualified,
) {
  const result = publishRemoteAttention(
    remoteAttentionStateEntryMap(state),
    remoteAttentionStateOrder(state),
    previousKey,
    key,
    qualifies,
    task,
    becameQualified,
  );

  return {
    publishedKey: result.publishedKey,
    state: remoteAttentionStateFromParts(result.entryMap, result.order),
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

function removeRemoteAttentionState(state, key) {
  const entries = remoteAttentionStateEntryMap(state);
  if (!key || !entries[key]) {
    return {
      state: state || createRemoteAttentionState(),
    };
  }

  const result = removeRemoteAttention(
    entries,
    remoteAttentionStateOrder(state),
    key,
  );
  return {
    state: remoteAttentionStateFromParts(result.entryMap, result.order),
  };
}

function recomputeRemoteAttentionState(state) {
  return remoteAttentionStateFromParts(
    remoteAttentionStateEntryMap(state),
    remoteAttentionStateOrder(state),
  );
}
