// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

const normalSlotLimit = 9;
const metaZeroShortcutIndex = 9;

function integerValue(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function normalSlotNumberForIndex(index) {
  const normalIndex = integerValue(index, -1);
  return normalIndex >= 0 && normalIndex < normalSlotLimit
    ? normalIndex + 1
    : 0;
}

function hasRemoteAttentionItem(remoteAttentionSnapshot) {
  const snapshot = remoteAttentionSnapshot || {};
  return Number(snapshot.count || 0) > 0;
}

function markMetaZeroTarget(items) {
  const visibleItems = Array.from(items || []);
  return visibleItems.map((item, index) =>
    Object.assign({}, item, {
      isMeta0Target: index === visibleItems.length - 1,
    }),
  );
}

function composeVisibleTaskItems(normalEntries, remoteAttentionSnapshot) {
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

function visibleItemForNormalIndex(visibleItems, normalIndex) {
  const targetIndex = integerValue(normalIndex, -1);
  if (targetIndex < 0) {
    return null;
  }

  const items = Array.from(visibleItems || []);
  for (let index = 0; index < items.length; ++index) {
    const item = items[index];
    if (item?.kind === "normal" && item.sourceIndex === targetIndex) {
      return item;
    }
  }

  return null;
}

function activationTargetForShortcutIndex(visibleItems, shortcutIndex) {
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
