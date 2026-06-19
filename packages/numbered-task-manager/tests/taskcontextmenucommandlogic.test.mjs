// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskContextMenuCommandLogic.mjs",
    import.meta.url,
  ),
  [
    "contextMenuLauncherCommand",
    "contextMenuTaskCommand",
    "normalizedContextMenuLauncherCommand",
    "normalizedContextMenuTaskCommand",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(logic.contextMenuLauncherCommand("pinLauncher", "app.desktop")), {
  action: "pinLauncher",
  kind: "launcher-command",
  launcherUrl: "app.desktop",
  launchers: [],
});
assert.deepEqual(
  plain(logic.contextMenuLauncherCommand("replaceLauncherList", ["a", "", "b"])),
  {
    action: "replaceLauncherList",
    kind: "launcher-command",
    launcherUrl: "",
    launchers: ["a", "b"],
  },
);
assert.deepEqual(
  plain(
    logic.normalizedContextMenuLauncherCommand({
      action: "replaceLauncherList",
      launchers: ["a", "", "b"],
    }),
  ),
  {
    action: "replaceLauncherList",
    kind: "launcher-command",
    launcherUrl: "",
    launchers: ["a", "b"],
  },
);
assert.deepEqual(plain(logic.contextMenuTaskCommand("requestMove")), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestMove",
});
assert.deepEqual(
  plain(logic.contextMenuTaskCommand("requestVirtualDesktops", ["desktop-a"])),
  {
    arguments: [["desktop-a"]],
    kind: "task-model-request",
    requestMethod: "requestVirtualDesktops",
  },
);
assert.deepEqual(plain(logic.normalizedContextMenuTaskCommand("requestMove")), {
  arguments: [],
  kind: "task-model-request",
  requestMethod: "requestMove",
});

const taskActionLogicSource = readFileSync(
  new URL("../package/contents/ui/TaskActionLogic.mjs", import.meta.url),
  "utf8",
);
assert.match(
  taskActionLogicSource,
  /import \{[^}]*normalizedContextMenuLauncherCommand[^}]*normalizedContextMenuTaskCommand[^}]*\} from "\.\/TaskContextMenuCommandLogic\.mjs"/s,
);
assert.doesNotMatch(taskActionLogicSource, /export function contextMenuLauncherCommand\(/);
assert.doesNotMatch(taskActionLogicSource, /export function contextMenuTaskCommand\(/);

for (const modulePath of [
  "TaskContextMenuLauncherActivityLogic.mjs",
  "TaskContextMenuPinLogic.mjs",
  "TaskContextMenuTaskActivityLogic.mjs",
  "TaskContextMenuVirtualDesktopLogic.mjs",
  "TaskContextMenuWindowActionLogic.mjs",
]) {
  const source = readFileSync(
    new URL(`../package/contents/ui/${modulePath}`, import.meta.url),
    "utf8",
  );
  assert.match(source, /import \{[^}]*contextMenu.*Command[^}]*\} from "\.\/TaskContextMenuCommandLogic\.mjs"/s);
  assert.doesNotMatch(source, /from "\.\/TaskActionLogic\.mjs"/);
}
