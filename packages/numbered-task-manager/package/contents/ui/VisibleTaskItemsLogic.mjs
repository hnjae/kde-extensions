// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  metaZeroShortcutIndex,
  normalSlotNumberForIndex,
} from "./TaskNumberingLogic.mjs";

export const normalItemKind = "normal";
export const remoteAttentionItemKind = "remoteAttention";

export function integerValue(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

export function isNormalVisibleItem(item) {
  return item?.kind === normalItemKind;
}

export function isRemoteAttentionVisibleItem(item) {
  return item?.kind === remoteAttentionItemKind;
}

export function visibleItemDescriptorContext(item) {
  const descriptor = item || {};
  return {
    numbered: Boolean(descriptor.numbered),
    slotNumber:
      descriptor.slotNumber === undefined ? null : descriptor.slotNumber,
    sourceIndex:
      descriptor.sourceIndex === undefined ? null : descriptor.sourceIndex,
    sourceModel: descriptor.sourceModel || "",
    targetKind: descriptor.kind || "",
  };
}

export function invalidVisibleItemDescriptor(code, item, extraContext) {
  return {
    code,
    context: Object.assign(
      visibleItemDescriptorContext(item),
      extraContext || {},
    ),
    ok: false,
  };
}

export function validateVisibleItemDescriptor(item) {
  if (!item) {
    return invalidVisibleItemDescriptor("missing-visible-item", item);
  }

  const descriptor = item || {};
  const kind = descriptor.kind || "";
  if (kind !== normalItemKind && kind !== remoteAttentionItemKind) {
    return invalidVisibleItemDescriptor("unsupported-target-kind", item);
  }

  const expectedSourceModel = kind;
  if ((descriptor.sourceModel || "") !== expectedSourceModel) {
    return invalidVisibleItemDescriptor("source-model-mismatch", item, {
      expectedSourceModel,
    });
  }

  if (kind === normalItemKind) {
    if (descriptor.sourceIndex === undefined || descriptor.sourceIndex < 0) {
      return invalidVisibleItemDescriptor("invalid-source-index", item);
    }

    if (descriptor.numbered !== true) {
      return invalidVisibleItemDescriptor("invalid-numbered-state", item);
    }

    if (descriptor.slotNumber < 1 || descriptor.slotNumber > 9) {
      return invalidVisibleItemDescriptor("invalid-slot-number", item);
    }
  }

  if (kind === remoteAttentionItemKind) {
    if (descriptor.sourceIndex !== -1) {
      return invalidVisibleItemDescriptor("invalid-source-index", item);
    }

    if (descriptor.numbered !== false) {
      return invalidVisibleItemDescriptor("invalid-numbered-state", item);
    }

    if (descriptor.slotNumber !== 0) {
      return invalidVisibleItemDescriptor("invalid-slot-number", item);
    }
  }

  return {
    context: visibleItemDescriptorContext(item),
    ok: true,
  };
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
      kind: normalItemKind,
      modelIndex: entries[index]?.modelIndex,
      numbered: slotNumber !== 0,
      slotNumber,
      sourceIndex: index,
      sourceModel: normalItemKind,
    });
  }

  if (hasRemoteAttentionItem(remoteAttentionSnapshot)) {
    const snapshot = remoteAttentionSnapshot || {};
    const target = snapshot.target || null;
    visibleItems.push({
      count: Number(snapshot.count || 0),
      entry: target,
      kind: remoteAttentionItemKind,
      modelIndex: target?.modelIndex,
      numbered: false,
      slotNumber: 0,
      sourceIndex: -1,
      sourceModel: remoteAttentionItemKind,
    });
  }

  return markMetaZeroTarget(visibleItems);
}

export function normalVisibleTaskItems(visibleItems) {
  const items = Array.from(visibleItems || []);
  return items.filter(isNormalVisibleItem);
}

export function visibleRemoteAttentionItem(visibleItems) {
  const items = Array.from(visibleItems || []);
  for (let index = 0; index < items.length; ++index) {
    const item = items[index];
    if (isRemoteAttentionVisibleItem(item)) {
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
    if (isNormalVisibleItem(item) && item.slotNumber === slotNumber) {
      return item;
    }
  }

  return null;
}
