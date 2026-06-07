// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const menuQml = readFileSync(
  new URL("../package/contents/ui/TaskContextMenu.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskContextMenuAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskContextMenuAdapter\s*\{/);
assert.match(mainQml, /id:\s*contextMenuAdapter/);
assert.match(mainQml, /launcherModel:\s*tasksModel/);
assert.match(
  mainQml,
  /contextMenuAdapter\.openTaskContextMenu\(Object\.assign\(/,
);
assert.match(mainQml, /root\.logActionResult\(result\)/);
assert.match(mainQml, /launcherCommands\.dispatchLauncherCommand\(command\)/);
assert.doesNotMatch(mainQml, /function openTaskContextMenu\(/);
assert.doesNotMatch(mainQml, /id:\s*contextMenuComponent/);
assert.doesNotMatch(mainQml, /contextMenuComponent\.createObject/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.contextMenuRequestResult/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.contextMenuCreationResult/);

assert.match(sourceQml, /import "TaskActionLogic\.js" as TaskActionLogic/);
assert.match(sourceQml, /QtQuick\.Item\s*\{/);
assert.match(sourceQml, /property var launcherModel/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /signal launcherCommandRequested\(var command\)/);
assert.match(sourceQml, /function openTaskContextMenu\(request\)/);
assert.match(sourceQml, /TaskActionLogic\.contextMenuRequestResult\(request\)/);
assert.match(sourceQml, /contextMenuComponent\.createObject\(visualParent/);
assert.match(
  sourceQml,
  /TaskActionLogic\.contextMenuCreationResult\(menu, menuRequest\)/,
);
assert.match(sourceQml, /visualParent\.contextMenuOpen = true/);
assert.match(sourceQml, /visualParent\.contextMenuOpen = false/);
assert.match(
  sourceQml,
  /menu\.launcherCommandRequested\.connect\(command => root\.launcherCommandRequested\(command\)\)/,
);
assert.match(
  sourceQml,
  /menu\.actionResult\.connect\(result => root\.actionResult\(result\)\)/,
);
assert.match(sourceQml, /menu\.show\(\)/);
assert.match(sourceQml, /\bTaskContextMenu\s*\{/);

assert.match(menuQml, /signal actionResult\(var result\)/);
assert.match(menuQml, /root\.actionResult\(result\)/);
assert.doesNotMatch(menuQml, /console\.warn\("Numbered Task Manager action "/);
