// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherCommandLogic.mjs", import.meta.url),
  [
    "contextMenuLauncherCommandDispatchResult",
    "launcherMutationPersistenceResult",
    "launcherMutationRequest",
    "launcherMutationResult",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(
  plain(logic.launcherMutationRequest("pinLauncher", "app.desktop")),
  {
    action: "pinLauncher",
    code: "ready",
    context: {
      launcherUrl: "app.desktop",
    },
    diagnostic: false,
    launcherUrl: "app.desktop",
    ok: true,
  },
);
assert.equal(
  logic.launcherMutationRequest("pinLauncher", "").code,
  "missing-launcher-url",
);
assert.equal(
  logic.launcherMutationResult(
    logic.launcherMutationRequest("unpinLauncher", "app.desktop"),
    false,
  ).code,
  "request-rejected",
);
assert.equal(
  logic.launcherMutationPersistenceResult(
    logic.launcherMutationRequest("pinLauncher", "app.desktop"),
    {
      code: "missing-launcher-sync",
      failedTargets: ["sync"],
      launchers: ["app.desktop"],
      ok: false,
    },
  ).context.launcherUrl,
  "app.desktop",
);
assert.equal(
  logic.contextMenuLauncherCommandDispatchResult({
    action: "bad-launcher-command",
  }).code,
  "unknown-launcher-command",
);
assert.deepEqual(
  plain(
    logic.launcherMutationPersistenceResult(
      logic.launcherMutationRequest("pinLauncher", "app.desktop"),
      {
        code: "reconciliation-pending",
        failedTargets: ["config"],
        ok: false,
        targetLaunchers: ["app.desktop"],
      },
    ),
  ),
  {
    action: "pinLauncher",
    code: "reconciliation-pending",
    context: {
      failedTargets: ["config"],
      launcherUrl: "app.desktop",
      launchers: ["app.desktop"],
      syncCode: "reconciliation-pending",
    },
    diagnostic: false,
    launcherUrl: "app.desktop",
    ok: false,
  },
);
