// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuFooterLogic.mjs",
    import.meta.url,
  ),
  [
    "contextMenuFooterAction",
    "contextMenuFooterSection",
    "executeContextMenuFooterAction",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

const configureAction = logic.contextMenuFooterAction("configureWidget", {
  enabled: true,
  icon: "configure",
  text: "Configure Numbered Task Manager",
  visible: true,
});
assert.deepEqual(plain(configureAction), {
  action: "configureWidget",
  enabled: true,
  icon: "configure",
  kind: "context-menu-footer-action",
  text: "Configure Numbered Task Manager",
  visible: true,
});
assert.deepEqual(plain(logic.contextMenuFooterAction("editMode", null)), {
  action: "editMode",
  enabled: false,
  icon: "",
  kind: "context-menu-footer-action",
  text: "",
  visible: false,
});
assert.deepEqual(
  plain(
    logic.contextMenuFooterSection(
      configureAction,
      logic.contextMenuFooterAction("editMode", null),
    ),
  ),
  {
    visible: true,
  },
);

let triggerCount = 0;
assert.deepEqual(
  plain(
    logic.executeContextMenuFooterAction(configureAction, {
      trigger() {
        triggerCount += 1;
      },
    }),
  ),
  {
    action: "configureWidget",
    code: "triggered",
    context: {
      footerActionKind: "context-menu-footer-action",
    },
    diagnostic: false,
    ok: true,
  },
);
assert.equal(triggerCount, 1);
assert.equal(
  logic.executeContextMenuFooterAction(configureAction, null).code,
  "missing-footer-action",
);
assert.equal(
  logic.executeContextMenuFooterAction(configureAction, {
    trigger() {
      return false;
    },
  }).code,
  "trigger-rejected",
);

const thrownResult = logic.executeContextMenuFooterAction(configureAction, {
  trigger() {
    throw Object.assign(new Error("configure failed"), {
      code: "E_CONFIGURE_FAILED",
    });
  },
});
assert.equal(thrownResult.ok, false);
assert.equal(thrownResult.code, "trigger-threw");
assert.equal(thrownResult.context.error, "configure failed");
assert.equal(thrownResult.context.errorCode, "E_CONFIGURE_FAILED");
