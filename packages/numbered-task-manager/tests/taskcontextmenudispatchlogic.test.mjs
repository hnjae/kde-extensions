// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuDispatchLogic.mjs",
    import.meta.url,
  ),
  ["contextMenuActionDispatchFailure", "contextMenuLauncherActivityResult"],
);

const dispatchFailure = logic.contextMenuActionDispatchFailure(
  {
    command: {
      action: "pinLauncher",
      launcherUrl: "applications:org.example.App.desktop",
    },
    kind: "launcherCommand",
  },
  "missing-adapter",
);
assert.equal(dispatchFailure.action, "dispatchContextMenuAction");
assert.equal(dispatchFailure.code, "missing-adapter");
assert.equal(dispatchFailure.context.commandAction, "pinLauncher");
assert.equal(
  dispatchFailure.context.launcherUrl,
  "applications:org.example.App.desktop",
);

const launcherActivityFailure = logic.contextMenuLauncherActivityResult(
  {
    changed: false,
    reason: "bad-update",
  },
  "invalid-launcher-activity-update",
  "applications:org.example.App.desktop",
);
assert.equal(launcherActivityFailure.action, "updateLauncherActivities");
assert.equal(launcherActivityFailure.code, "invalid-launcher-activity-update");
assert.equal(launcherActivityFailure.context.changed, false);
assert.equal(launcherActivityFailure.context.reason, "bad-update");
assert.equal(
  launcherActivityFailure.context.launcherUrl,
  "applications:org.example.App.desktop",
);
