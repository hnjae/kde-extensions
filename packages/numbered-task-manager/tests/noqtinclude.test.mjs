// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const uiDirectory = new URL("../package/contents/ui/", import.meta.url);
const productionScriptPattern = /\.(?:js|mjs|qml)$/;
const offenders = [];

for (const entry of readdirSync(uiDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !productionScriptPattern.test(entry.name)) {
    continue;
  }

  const source = readFileSync(new URL(entry.name, uiDirectory), "utf8");
  if (/\bQt\.include\s*\(/.test(source)) {
    offenders.push(entry.name);
  }
}

assert.deepEqual(
  offenders,
  [],
  `Production QML JavaScript resources must not use Qt.include(): ${offenders.join(", ")}`,
);
