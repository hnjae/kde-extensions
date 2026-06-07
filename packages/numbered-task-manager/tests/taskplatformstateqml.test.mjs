// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainQml = readFileSync(
  new URL("../package/contents/ui/main.qml", import.meta.url),
  "utf8",
);
const sourceUrl = new URL(
  "../package/contents/ui/TaskPlatformState.qml",
  import.meta.url,
);

assert.equal(existsSync(sourceUrl), true);

const sourceQml = readFileSync(sourceUrl, "utf8");

assert.match(mainQml, /\bTaskPlatformState\s*\{/);
assert.match(mainQml, /id:\s*taskPlatformState/);
assert.match(mainQml, /taskModel:\s*tasksModel/);
assert.match(mainQml, /activity:\s*taskPlatformState\.currentActivity/);
assert.match(mainQml, /virtualDesktop:\s*taskPlatformState\.currentDesktop/);
assert.match(mainQml, /currentActivity:\s*taskPlatformState\.currentActivity/);
assert.match(mainQml, /currentDesktop:\s*taskPlatformState\.currentDesktop/);
assert.match(
  mainQml,
  /launcherRevision:\s*taskPlatformState\.launcherRevision/,
);
assert.match(
  mainQml,
  /visibleLauncherPosition:\s*\(launcherUrl, launcherRevisionToken\) => taskPlatformState\.visibleLauncherPosition\(launcherUrl, launcherRevisionToken\)/,
);
assert.match(
  mainQml,
  /isInCurrentActivity:\s*activities => taskPlatformState\.isInCurrentActivity\(activities\)/,
);
assert.match(
  mainQml,
  /onLauncherListChanged:\s*\{[\s\S]*?taskPlatformState\.noteLauncherListChanged\(\);/,
);
assert.doesNotMatch(mainQml, /\bTaskManager\.ActivityInfo\s*\{/);
assert.doesNotMatch(mainQml, /\bTaskManager\.VirtualDesktopInfo\s*\{/);
assert.doesNotMatch(mainQml, /property int launcherRevision:\s*0/);
assert.doesNotMatch(mainQml, /function visibleLauncherPosition\(/);
assert.doesNotMatch(mainQml, /function isInCurrentActivity\(/);
assert.doesNotMatch(mainQml, /root\.launcherRevision \+= 1/);

assert.match(sourceQml, /import org\.kde\.taskmanager as TaskManager/);
assert.match(
  sourceQml,
  /import "ActivityScopeLogic\.js" as ActivityScopeLogic/,
);
assert.match(sourceQml, /import "LauncherListLogic\.js" as LauncherListLogic/);
assert.match(sourceQml, /QtQuick\.QtObject\s*\{/);
assert.match(sourceQml, /required property var taskModel/);
assert.match(
  sourceQml,
  /readonly property string currentActivity:\s*activityInfo\.currentActivity/,
);
assert.match(
  sourceQml,
  /readonly property var currentDesktop:\s*virtualDesktopInfo\.currentDesktop/,
);
assert.match(sourceQml, /property int launcherRevision:\s*0/);
assert.match(sourceQml, /\bTaskManager\.ActivityInfo\s*\{/);
assert.match(
  sourceQml,
  /onCurrentActivityChanged:\s*\{[\s\S]*?root\.launcherRevision \+= 1;/,
);
assert.match(sourceQml, /\bTaskManager\.VirtualDesktopInfo\s*\{/);
assert.match(sourceQml, /function noteLauncherListChanged\(\)/);
assert.match(
  sourceQml,
  /function visibleLauncherPosition\(launcherUrl, launcherRevisionToken\)/,
);
assert.match(
  sourceQml,
  /LauncherListLogic\.visibleLauncherPosition\(root\.taskModel\.launcherList, launcherUrl, root\.currentActivity, url => root\.taskModel\.launcherPosition\(url\)\)/,
);
assert.match(sourceQml, /function isInCurrentActivity\(activities\)/);
assert.match(
  sourceQml,
  /ActivityScopeLogic\.isInCurrentActivity\(activities, root\.currentActivity\)/,
);
