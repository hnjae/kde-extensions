// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/ErrorContextLogic.mjs", import.meta.url),
  ["assignErrorContext", "errorContext", "errorMessage"],
);

const codedError = Object.assign(new Error("backend failed"), {
  code: "E_BACKEND",
});
assert.deepEqual(logic.errorContext(codedError), {
  error: "backend failed",
  errorCode: "E_BACKEND",
  errorMessage: "backend failed",
  errorName: "Error",
});

assert.deepEqual(logic.errorContext("plain failure"), {
  error: "plain failure",
  errorMessage: "plain failure",
  errorName: "string",
});

assert.deepEqual(logic.errorContext({ code: "E_OBJECT" }), {
  error: "[object Object]",
  errorCode: "E_OBJECT",
  errorMessage: "[object Object]",
});

assert.equal(logic.errorMessage(null), "null");
assert.deepEqual(logic.assignErrorContext({ action: "test" }, codedError), {
  action: "test",
  error: "backend failed",
  errorCode: "E_BACKEND",
  errorMessage: "backend failed",
  errorName: "Error",
});
