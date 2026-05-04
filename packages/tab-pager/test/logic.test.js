// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

const assert = require("node:assert/strict");
const test = require("node:test");

if (!process.env.SAMPLE_LOGIC_JS) {
  throw new Error("SAMPLE_LOGIC_JS must point at the compiled logic.js file.");
}

const logic = require(process.env.SAMPLE_LOGIC_JS);

test("normalizes names before greeting", () => {
  assert.equal(logic.greetingFor(" Plasma "), "Hello, Plasma!");
});

test("uses Plasma as the blank-name fallback", () => {
  assert.equal(logic.greetingFor("   "), "Hello, Plasma!");
});
