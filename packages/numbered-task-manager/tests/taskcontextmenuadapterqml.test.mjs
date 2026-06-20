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
const cmakeSource = readFileSync(
  new URL("../CMakeLists.txt", import.meta.url),
  "utf8",
);
const rolePortUrl = new URL(
  "../package/contents/ui/TaskContextMenuRolePort.qml",
  import.meta.url,
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskContextMenuAdapter.qml",
  import.meta.url,
);

assert.equal(existsSync(rolePortUrl), true);
assert.equal(existsSync(sourceUrl), true);

const rolePortQml = readFileSync(rolePortUrl, "utf8");
const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskContextMenuAdapter\s*\{/);
assert.match(mainQml, /id:\s*contextMenuAdapter/);
assert.match(
  mainQml,
  /\bLauncherReadPort\s*\{[\s\S]*?id:\s*launcherReadPort[\s\S]*?taskModel:\s*tasksModel[\s\S]*?\}/,
);
assert.match(mainQml, /launcherReadPort:\s*launcherReadPort/);
assert.doesNotMatch(mainQml, /launcherModel:\s*tasksModel/);
assert.match(
  mainQml,
  /\bTaskCommandPort\s*\{[\s\S]*?id:\s*taskCommandPort[\s\S]*?taskModel:\s*tasksModel[\s\S]*?\}/,
);
assert.match(
  mainQml,
  /\bTaskContextMenuRolePort\s*\{[\s\S]*?id:\s*taskContextMenuRolePort[\s\S]*?taskModel:\s*tasksModel[\s\S]*?\}/,
);
assert.match(mainQml, /taskRolePort:\s*taskContextMenuRolePort/);
assert.match(mainQml, /taskCommandPort:\s*taskCommandPort/);
assert.match(
  mainQml,
  /onContextMenuRequested:\s*request\s*=>\s*\{[\s\S]*?contextMenuAdapter\.openTaskContextMenu\(request\);[\s\S]*?\}/,
);
assert.doesNotMatch(
  mainQml,
  /contextMenuAdapter\.openTaskContextMenu\(Object\.assign\(\{\s*taskModel:\s*tasksModel\s*\}/,
);
assert.match(mainQml, /actionLogger\.logActionResult\(result\)/);
assert.match(mainQml, /launcherCommands\.dispatchLauncherCommand\(command\)/);
assert.doesNotMatch(mainQml, /function openTaskContextMenu\(/);
assert.doesNotMatch(mainQml, /id:\s*contextMenuComponent/);
assert.doesNotMatch(mainQml, /contextMenuComponent\.createObject/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.contextMenuRequestResult/);
assert.doesNotMatch(mainQml, /TaskActionLogic\.contextMenuCreationResult/);

assert.match(
  sourceQml,
  /import "TaskContextMenuRequestLogic\.mjs" as TaskContextMenuRequestLogic/,
);
assert.doesNotMatch(
  sourceQml,
  /import "TaskActionLogic\.mjs" as TaskActionLogic/,
);
assert.match(sourceQml, /QtQuick\.Item\s*\{/);
assert.match(sourceQml, /property var launcherReadPort/);
assert.doesNotMatch(sourceQml, /property var launcherModel/);
assert.match(sourceQml, /property var taskRolePort/);
assert.doesNotMatch(sourceQml, /property var taskModel/);
assert.match(sourceQml, /property var taskCommandPort/);
assert.match(sourceQml, /signal actionResult\(var result\)/);
assert.match(sourceQml, /signal launcherCommandRequested\(var command\)/);
assert.match(sourceQml, /function notifyContextMenuOpened\(menuRequest\)/);
assert.match(sourceQml, /function notifyContextMenuClosed\(menuRequest\)/);
assert.match(sourceQml, /function contextMenuRequest\(request\)/);
assert.match(
  sourceQml,
  /Object\.assign\(\{\s*taskRolePort:\s*root\.taskRolePort\s*\},\s*request \|\| \(\{\}\)\)/,
);
assert.match(sourceQml, /function openTaskContextMenu\(request\)/);
assert.match(
  sourceQml,
  /TaskContextMenuRequestLogic\.contextMenuRequestResult\(contextMenuRequest\(request\)\)/,
);
assert.match(sourceQml, /contextMenuComponent\.createObject\(visualParent/);
assert.match(sourceQml, /launcherReadPort:\s*root\.launcherReadPort/);
assert.doesNotMatch(sourceQml, /launcherModel:\s*root\.launcherModel/);
assert.match(sourceQml, /taskRolePort:\s*menuRequest\.taskRolePort/);
assert.doesNotMatch(sourceQml, /taskModel:\s*menuRequest\.taskModel/);
assert.match(sourceQml, /taskCommandPort:\s*root\.taskCommandPort/);
assert.match(
  sourceQml,
  /TaskContextMenuRequestLogic\.contextMenuCreationResult\(menu, menuRequest\)/,
);
assert.doesNotMatch(sourceQml, /visualParent\.contextMenuOpen/);
assert.match(sourceQml, /notifyContextMenuOpened\(menuRequest\)/);
assert.match(
  sourceQml,
  /menu\.closed\.connect\(\(\) => root\.notifyContextMenuClosed\(menuRequest\)\)/,
);
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
assert.match(menuQml, /property var launcherReadPort/);
assert.doesNotMatch(menuQml, /property var launcherModel/);
assert.match(menuQml, /property var taskRolePort/);
assert.doesNotMatch(menuQml, /property var taskModel/);
assert.match(menuQml, /property var taskCommandPort/);
assert.match(menuQml, /launcherReadPort:\s*root\.launcherReadPort/);
assert.match(menuQml, /taskRolePort:\s*root\.taskRolePort/);
assert.match(menuQml, /taskCommandPort:\s*root\.taskCommandPort/);
assert.doesNotMatch(menuQml, /console\.warn\("Numbered Task Manager action "/);
assert.match(
  menuQml,
  /import org\.hnjae\.numberedtaskmanager as NumberedTaskManager/,
);
assert.match(menuQml, /NumberedTaskManager\.TaskContextMenuBackend\s*\{/);
assert.match(
  menuQml,
  /onDesktopActionResult:\s*result\s*=>\s*\{[\s\S]*?root\.actionResult\(result\);[\s\S]*?\}/,
);
assert.match(menuQml, /desktopActions\(root\.taskRoles\.launcherUrl/);
assert.match(menuQml, /item\.action = modelData/);
assert.match(menuQml, /id:\s*moreActionsItem/);
assert.match(menuQml, /root\.moreActionsSection\.moreActions/);
assert.match(menuQml, /icon:\s*actionState\.icon \|\| ""/);
assert.match(cmakeSource, /project\(numberedtaskmanager\b/);
assert.match(cmakeSource, /add_library\(numberedtaskmanagerplugin SHARED/);
assert.match(cmakeSource, /src\/taskcontextmenubackend\.cpp/);
assert.match(cmakeSource, /install\(DIRECTORY package\//);

assert.match(rolePortQml, /property var taskModel/);
assert.match(rolePortQml, /function hasTask\(modelIndex\)/);
assert.match(rolePortQml, /TaskEntryLogic\.hasValidModelIndex\(modelIndex\)/);
assert.match(rolePortQml, /function data\(modelIndex, role\)/);
assert.match(rolePortQml, /taskModel\.data\(modelIndex, role\)/);
assert.match(rolePortQml, /function roleIds\(\)/);
