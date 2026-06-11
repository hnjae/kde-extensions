// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { composeNormalTaskEntries } from "./TaskModelLogic.mjs";

export function normalTaskStoreEntryMap(store) {
  return Object.assign({}, store?.entryMap || {});
}

export function normalTaskStoreManualOrder(store) {
  return Array.from(store?.manualOrder || []);
}

export function normalTaskStoreNextPublicationId(store) {
  const numericId = Number(store?.nextPublicationId || 0);
  return Number.isFinite(numericId) ? numericId : 0;
}

export function createNormalTaskStore() {
  return {
    entries: [],
    entryMap: {},
    manualOrder: [],
    nextPublicationId: 0,
  };
}

export function createNormalTaskPublicationKey(nextPublicationId) {
  const numericId = Number(nextPublicationId || 0);
  const nextId = Number.isFinite(numericId) ? numericId + 1 : 1;
  return {
    key: `normal:${nextId.toString()}`,
    nextPublicationId: nextId,
  };
}

export function allocateNormalTaskPublication(store) {
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

export function recomputeNormalTaskStore(store, visibleLauncherPosition) {
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

export function removeNormalTask(store, key, visibleLauncherPosition) {
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

export function publishNormalTask(
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
