// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export const normalSlotLimit = 9;
export const metaZeroShortcutIndex = 9;

export function integerValue(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

export function normalSlotNumberForIndex(index) {
  const normalIndex = integerValue(index, -1);
  return normalIndex >= 0 && normalIndex < normalSlotLimit
    ? normalIndex + 1
    : 0;
}

export function hasRemoteAttentionItem(remoteAttentionSnapshot) {
  const snapshot = remoteAttentionSnapshot || {};
  return Number(snapshot.count || 0) > 0;
}

export function markMetaZeroTarget(items) {
  const visibleItems = Array.from(items || []);
  return visibleItems.map((item, index) =>
    Object.assign({}, item, {
      isMeta0Target: index === visibleItems.length - 1,
    }),
  );
}

export function composeVisibleTaskItems(
  normalEntries,
  remoteAttentionSnapshot,
) {
  const visibleItems = [];
  const entries = Array.from(normalEntries || []);

  for (let index = 0; index < entries.length; ++index) {
    const slotNumber = normalSlotNumberForIndex(index);
    visibleItems.push({
      entry: entries[index],
      kind: "normal",
      modelIndex: entries[index]?.modelIndex,
      numbered: slotNumber !== 0,
      slotNumber,
      sourceIndex: index,
      sourceModel: "normal",
    });
  }

  if (hasRemoteAttentionItem(remoteAttentionSnapshot)) {
    const snapshot = remoteAttentionSnapshot || {};
    const target = snapshot.target || null;
    visibleItems.push({
      count: Number(snapshot.count || 0),
      entry: target,
      kind: "remoteAttention",
      modelIndex: target?.modelIndex,
      numbered: false,
      slotNumber: 0,
      sourceIndex: -1,
      sourceModel: "remoteAttention",
    });
  }

  return markMetaZeroTarget(visibleItems);
}

export function normalVisibleTaskItems(visibleItems) {
  const items = Array.from(visibleItems || []);
  return items.filter((item) => item?.kind === "normal");
}

export function visibleRemoteAttentionItem(visibleItems) {
  const items = Array.from(visibleItems || []);
  for (let index = 0; index < items.length; ++index) {
    const item = items[index];
    if (item?.kind === "remoteAttention") {
      return item;
    }
  }

  return null;
}

export function activationTargetForShortcutIndex(visibleItems, shortcutIndex) {
  const index = integerValue(shortcutIndex, -1);
  if (index < 0 || index > metaZeroShortcutIndex) {
    return null;
  }

  const items = Array.from(visibleItems || []);
  if (index === metaZeroShortcutIndex) {
    for (let itemIndex = 0; itemIndex < items.length; ++itemIndex) {
      if (items[itemIndex]?.isMeta0Target) {
        return items[itemIndex];
      }
    }
    return null;
  }

  const slotNumber = index + 1;
  for (let itemIndex = 0; itemIndex < items.length; ++itemIndex) {
    const item = items[itemIndex];
    if (item?.kind === "normal" && item.slotNumber === slotNumber) {
      return item;
    }
  }

  return null;
}
