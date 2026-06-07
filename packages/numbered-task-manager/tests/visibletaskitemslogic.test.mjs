// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const visibleTaskItemsLogicSource = readFileSync(
  new URL("../package/contents/ui/VisibleTaskItemsLogic.js", import.meta.url),
  "utf8",
);
assert.doesNotMatch(
  visibleTaskItemsLogicSource,
  /function visibleItemForNormalIndex\b/,
);

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/VisibleTaskItemsLogic.js", import.meta.url),
  [
    "activationTargetForShortcutIndex",
    "composeVisibleTaskItems",
    "normalVisibleTaskItems",
    "visibleItemForNormalIndex",
    "visibleRemoteAttentionItem",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

const normalEntries = Array.from({ length: 11 }, (_, index) => ({
  entryKey: `task-${index}`,
  modelIndex: { valid: true, row: index },
  title: `Task ${index}`,
}));
const attentionTarget = {
  entryKey: "attention-target",
  modelIndex: { valid: true, row: 99 },
  title: "Needs Attention",
};

assert.deepEqual(plain(logic.composeVisibleTaskItems([], {})), []);
assert.equal(logic.activationTargetForShortcutIndex([], 0), null);
assert.equal(logic.activationTargetForShortcutIndex([], 9), null);

const threeNormalItems = logic.composeVisibleTaskItems(
  normalEntries.slice(0, 3),
  { count: 0, target: null },
);
assert.deepEqual(
  plain(
    threeNormalItems.map((item) => ({
      isMeta0Target: item.isMeta0Target,
      kind: item.kind,
      numbered: item.numbered,
      slotNumber: item.slotNumber,
      sourceIndex: item.sourceIndex,
      sourceModel: item.sourceModel,
    })),
  ),
  [
    {
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 1,
      sourceIndex: 0,
      sourceModel: "normal",
    },
    {
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 2,
      sourceIndex: 1,
      sourceModel: "normal",
    },
    {
      isMeta0Target: true,
      kind: "normal",
      numbered: true,
      slotNumber: 3,
      sourceIndex: 2,
      sourceModel: "normal",
    },
  ],
);
assert.equal(
  logic.activationTargetForShortcutIndex(threeNormalItems, 0).entry.entryKey,
  "task-0",
);
assert.equal(
  logic.activationTargetForShortcutIndex(threeNormalItems, 2).entry.entryKey,
  "task-2",
);
assert.equal(logic.activationTargetForShortcutIndex(threeNormalItems, 3), null);
assert.equal(
  logic.activationTargetForShortcutIndex(threeNormalItems, 9).entry.entryKey,
  "task-2",
);
assert.equal(
  logic.visibleItemForNormalIndex(threeNormalItems, 1).slotNumber,
  2,
);
assert.equal(logic.visibleItemForNormalIndex(threeNormalItems, 99), null);

const overflowItems = logic.composeVisibleTaskItems(normalEntries, {
  count: 0,
  target: null,
});
assert.deepEqual(
  plain(overflowItems.map((item) => item.slotNumber)),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0],
);
assert.deepEqual(plain(overflowItems.map((item) => item.numbered)), [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
]);
assert.equal(
  logic.activationTargetForShortcutIndex(overflowItems, 8).entry.entryKey,
  "task-8",
);
assert.equal(
  logic.activationTargetForShortcutIndex(overflowItems, 9).entry.entryKey,
  "task-10",
);

const attentionItems = logic.composeVisibleTaskItems(
  normalEntries.slice(0, 3),
  {
    count: 2,
    target: attentionTarget,
  },
);
assert.deepEqual(
  plain(
    attentionItems.map((item) => ({
      count: item.count,
      isMeta0Target: item.isMeta0Target,
      kind: item.kind,
      numbered: item.numbered,
      slotNumber: item.slotNumber,
      sourceIndex: item.sourceIndex,
      sourceModel: item.sourceModel,
    })),
  ),
  [
    {
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 1,
      sourceIndex: 0,
      sourceModel: "normal",
    },
    {
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 2,
      sourceIndex: 1,
      sourceModel: "normal",
    },
    {
      isMeta0Target: false,
      kind: "normal",
      numbered: true,
      slotNumber: 3,
      sourceIndex: 2,
      sourceModel: "normal",
    },
    {
      count: 2,
      isMeta0Target: true,
      kind: "remoteAttention",
      numbered: false,
      slotNumber: 0,
      sourceIndex: -1,
      sourceModel: "remoteAttention",
    },
  ],
);
assert.equal(logic.activationTargetForShortcutIndex(attentionItems, 3), null);
assert.equal(
  logic.activationTargetForShortcutIndex(attentionItems, 9).entry.entryKey,
  "attention-target",
);
assert.equal(
  logic.visibleRemoteAttentionItem(attentionItems).entry.entryKey,
  "attention-target",
);
assert.equal(logic.visibleRemoteAttentionItem(threeNormalItems), null);
assert.deepEqual(
  plain(
    logic.normalVisibleTaskItems(attentionItems).map((item) => ({
      entryKey: item.entry.entryKey,
      kind: item.kind,
      slotNumber: item.slotNumber,
      sourceIndex: item.sourceIndex,
    })),
  ),
  [
    {
      entryKey: "task-0",
      kind: "normal",
      slotNumber: 1,
      sourceIndex: 0,
    },
    {
      entryKey: "task-1",
      kind: "normal",
      slotNumber: 2,
      sourceIndex: 1,
    },
    {
      entryKey: "task-2",
      kind: "normal",
      slotNumber: 3,
      sourceIndex: 2,
    },
  ],
);
