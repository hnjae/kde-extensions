// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  createBaseTaskEntry,
  remoteAttentionIconFallback,
} from "./TaskEntryLogic.mjs";

export function createRemoteAttentionEntry(roles) {
  const taskRoles = roles || {};

  return Object.assign(
    {},
    createBaseTaskEntry(taskRoles, remoteAttentionIconFallback()),
    {
      winIds: Array.from(taskRoles.winIds || []),
    },
  );
}

export function remoteAttentionKey(winIds, launcherUrl, title, row) {
  const windowIds = Array.from(winIds || []);
  if (windowIds.length > 0) {
    return `window:${windowIds.join(",")}`;
  }

  return `row:${row.toString()}:${launcherUrl}:${title}`;
}

export function remoteAttentionSnapshot(entryMap, order) {
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

export function remoteAttentionStateEntryMap(state) {
  return Object.assign({}, state?.entryMap || {});
}

export function remoteAttentionStateOrder(state) {
  return Array.from(state?.order || []);
}

export function remoteAttentionStateFromParts(entryMap, order) {
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

export function createRemoteAttentionState() {
  return remoteAttentionStateFromParts({}, []);
}

export function createRemoteAttentionSourceRowState(values) {
  const state = values || {};
  return {
    hasSyncedAttention: Boolean(state.hasSyncedAttention),
    previousQualifies: Boolean(state.previousQualifies),
    publishedKey: String(state.publishedKey || ""),
  };
}

export function remoteAttentionSourceRowSnapshot(values) {
  const snapshot = values || {};
  return {
    key: String(snapshot.key || ""),
    qualifies: Boolean(snapshot.qualifies),
    task: Object.assign({}, snapshot.task || {}),
  };
}

export function remoteAttentionPublishCommand(
  previousKey,
  snapshot,
  becameQualified,
) {
  const taskSnapshot = remoteAttentionSourceRowSnapshot(snapshot);
  return {
    becameQualified: Boolean(becameQualified),
    key: taskSnapshot.key,
    previousKey,
    qualifies: taskSnapshot.qualifies,
    task: taskSnapshot.task,
    type: "publishRemoteAttention",
  };
}

export function remoteAttentionSourceRowChanged(state, snapshot) {
  const current = createRemoteAttentionSourceRowState(state);
  const taskSnapshot = remoteAttentionSourceRowSnapshot(snapshot);
  const becameQualified =
    current.hasSyncedAttention &&
    !current.previousQualifies &&
    taskSnapshot.qualifies;

  return {
    commands: [
      remoteAttentionPublishCommand(
        current.publishedKey,
        taskSnapshot,
        becameQualified,
      ),
      {
        type: "emitDiagnostics",
      },
    ],
    state: createRemoteAttentionSourceRowState({
      hasSyncedAttention: true,
      previousQualifies: taskSnapshot.qualifies,
      publishedKey: taskSnapshot.qualifies ? taskSnapshot.key : "",
    }),
  };
}

export function remoteAttentionSourceRowAppeared(state, snapshot) {
  return remoteAttentionSourceRowChanged(state, snapshot);
}

export function remoteAttentionSourceRowRemoved(state) {
  const current = createRemoteAttentionSourceRowState(state);
  return {
    commands: current.publishedKey
      ? [
          {
            key: current.publishedKey,
            type: "removeRemoteAttention",
          },
        ]
      : [],
    state: createRemoteAttentionSourceRowState(),
  };
}

export function publishRemoteAttention(
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

export function publishRemoteAttentionState(
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

export function removeRemoteAttention(entryMap, order, key) {
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

export function removeRemoteAttentionState(state, key) {
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

export function recomputeRemoteAttentionState(state) {
  return remoteAttentionStateFromParts(
    remoteAttentionStateEntryMap(state),
    remoteAttentionStateOrder(state),
  );
}
