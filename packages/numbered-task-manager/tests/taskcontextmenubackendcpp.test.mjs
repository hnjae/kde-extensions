// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync(
  new URL("../src/taskcontextmenubackend.h", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL("../src/taskcontextmenubackend.cpp", import.meta.url),
  "utf8",
);
const desktopActionLogicHeader = readFileSync(
  new URL("../src/desktopactionlogic.h", import.meta.url),
  "utf8",
);
const desktopActionLogicSource = readFileSync(
  new URL("../src/desktopactionlogic.cpp", import.meta.url),
  "utf8",
);

assert.match(desktopActionLogicHeader, /struct DesktopActionDescriptor/);
assert.match(
  header,
  /Q_SIGNAL void desktopActionResult\(const QVariantMap &result\)/,
);
assert.match(
  desktopActionLogicHeader,
  /QList<DesktopActionDescriptor>\s+desktopActionDescriptors/,
);
assert.match(
  desktopActionLogicHeader,
  /QVariantList\s+desktopActionsFromDescriptors/,
);

assert.match(desktopActionLogicSource, /DesktopActionDescriptor\s*\{/);
assert.match(desktopActionLogicSource, /\.text\s*=\s*serviceAction\.text\(\)/);
assert.match(
  desktopActionLogicSource,
  /\.iconName\s*=\s*serviceAction\.icon\(\)/,
);
assert.match(
  desktopActionLogicSource,
  /\.separator\s*=\s*serviceAction\.isSeparator\(\)/,
);
assert.match(desktopActionLogicSource, /\.serviceAction\s*=\s*serviceAction/);
assert.match(
  desktopActionLogicSource,
  /if \(source\.noDisplay\)\s*\{\s*continue;/,
);
assert.match(desktopActionLogicSource, /descriptorsWithContext/);
assert.match(
  desktopActionLogicSource,
  /descriptor\.launcherUrl\s*=\s*launcherUrl\.toString\(\)/,
);
assert.match(
  desktopActionLogicSource,
  /descriptor\.desktopEntryPath\s*=\s*desktopEntryPath/,
);

assert.match(desktopActionLogicSource, /desktopActionFromDescriptor/);
assert.match(desktopActionLogicSource, /action->setText\(descriptor\.text\)/);
assert.match(
  desktopActionLogicSource,
  /QIcon::fromTheme\(descriptor\.iconName\)/,
);
assert.match(
  desktopActionLogicSource,
  /action->setSeparator\(descriptor\.separator\)/,
);
assert.match(
  source,
  /KIO::ApplicationLauncherJob\(descriptor\.serviceAction\)/,
);
assert.match(desktopActionLogicSource, /connect\(.*job, &KJob::result/s);
assert.match(desktopActionLogicSource, /desktop-action-launch-failed/);
assert.match(desktopActionLogicHeader, /DesktopActionResultHandler/);
assert.match(desktopActionLogicSource, /resultHandler\(actionResult\)/);
assert.match(desktopActionLogicSource, /descriptor\.launcherUrl/);
assert.match(desktopActionLogicSource, /descriptor\.text/);

assert.match(
  source,
  /const QList<DesktopActionDescriptor> descriptors\s*=\s*desktopActionDescriptors\(\s*desktopActionSources\(service->actions\(\)\)\);/,
);
assert.match(source, /descriptorsWithContext\(descriptors, launcherUrl/);
assert.match(
  source,
  /return desktopActionsFromDescriptors\(\s*contextualDescriptors,\s*parent,/,
);
assert.match(source, /Q_EMIT desktopActionResult\(result\)/);
