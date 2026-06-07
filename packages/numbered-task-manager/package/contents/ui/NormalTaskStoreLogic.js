// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("TaskModelLogic.js");

function normalTaskStoreEntryMap(store) {
  return Object.assign({}, store?.entryMap || {});
}

function normalTaskStoreManualOrder(store) {
  return Array.from(store?.manualOrder || []);
}

function normalTaskStoreNextPublicationId(store) {
  const numericId = Number(store?.nextPublicationId || 0);
  return Number.isFinite(numericId) ? numericId : 0;
}

function createNormalTaskStore() {
  return {
    entries: [],
    entryMap: {},
    manualOrder: [],
    nextPublicationId: 0,
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

function allocateNormalTaskPublication(store) {
  const publication = createNormalTaskPublicationKey(
    normalTaskStoreNextPublicationId(store),
  );

  return {
    key: publication.key,
    store: {
      entries: Array.from(store?.entries || []),
      entryMap: normalTaskStoreEntryMap(store),
      manualOrder: normalTaskStoreManualOrder(store),
      nextPublicationId: publication.nextPublicationId,
    },
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
    nextPublicationId: normalTaskStoreNextPublicationId(store),
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
      nextPublicationId: normalTaskStoreNextPublicationId(store),
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
      nextPublicationId: normalTaskStoreNextPublicationId(store),
    },
    visibleLauncherPosition,
  );
}
