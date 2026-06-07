// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskModelLogic.js");

function normalTaskStoreEntryMap(store) {
  return Object.assign({}, store?.entryMap || {});
}

function normalTaskStoreManualOrder(store) {
  return Array.from(store?.manualOrder || []);
}

function createNormalTaskStore() {
  return {
    entries: [],
    entryMap: {},
    manualOrder: [],
  };
}

function createNormalTaskPublicationKey(nextPublicationId) {
  const numericId = Number(nextPublicationId || 0);
  const nextId = Number.isFinite(numericId) ? numericId + 1 : 1;
  return {
    key: `normal:${nextId.toString()}`,
    nextPublicationId: nextId,
  };
}

function recomputeNormalTaskStore(store, visibleLauncherPosition) {
  const entryMap = normalTaskStoreEntryMap(store);
  const result = composeNormalTaskEntries(
    entryMap,
    normalTaskStoreManualOrder(store),
    visibleLauncherPosition,
  );

  return {
    entries: result.entries,
    entryMap,
    manualOrder: result.manualOrder,
  };
}

function removeNormalTask(store, key, visibleLauncherPosition) {
  const entryMap = normalTaskStoreEntryMap(store);
  if (!key || !entryMap[key]) {
    return store || createNormalTaskStore();
  }

  delete entryMap[key];
  return recomputeNormalTaskStore(
    {
      entryMap,
      manualOrder: normalTaskStoreManualOrder(store),
    },
    visibleLauncherPosition,
  );
}

function publishNormalTask(
  store,
  key,
  qualifies,
  task,
  visibleLauncherPosition,
) {
  if (!qualifies) {
    return removeNormalTask(store, key, visibleLauncherPosition);
  }

  const entryMap = normalTaskStoreEntryMap(store);
  entryMap[key] = task;
  return recomputeNormalTaskStore(
    {
      entryMap,
      manualOrder: normalTaskStoreManualOrder(store),
    },
    visibleLauncherPosition,
  );
}
