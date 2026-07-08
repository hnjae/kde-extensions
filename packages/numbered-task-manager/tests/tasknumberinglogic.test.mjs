// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/TaskNumberingLogic.mjs", import.meta.url),
  [
    "metaZeroShortcutIndex",
    "normalSlotLimit",
    "normalSlotNumberForIndex",
    "validSlotNumber",
  ],
);

assert.equal(logic.normalSlotLimit, 9);
assert.equal(logic.metaZeroShortcutIndex, 9);
assert.equal(logic.normalSlotNumberForIndex(-1), 0);
assert.equal(logic.normalSlotNumberForIndex(0), 1);
assert.equal(logic.normalSlotNumberForIndex(8), 9);
assert.equal(logic.normalSlotNumberForIndex(9), 0);
assert.equal(logic.validSlotNumber(0), 0);
assert.equal(logic.validSlotNumber(1), 1);
assert.equal(logic.validSlotNumber(9), 9);
assert.equal(logic.validSlotNumber(10), 0);
