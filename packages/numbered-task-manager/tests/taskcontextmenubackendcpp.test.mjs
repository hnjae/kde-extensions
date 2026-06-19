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

assert.match(header, /struct DesktopActionDescriptor/);
assert.match(
  header,
  /QList<DesktopActionDescriptor>\s+desktopActionDescriptors/,
);
assert.match(header, /QVariantList\s+desktopActionsFromDescriptors/);

assert.match(source, /TaskContextMenuBackend::desktopActionDescriptors/);
assert.match(source, /DesktopActionDescriptor\s*\{/);
assert.match(source, /\.text\s*=\s*serviceAction\.text\(\)/);
assert.match(source, /\.iconName\s*=\s*serviceAction\.icon\(\)/);
assert.match(source, /\.separator\s*=\s*serviceAction\.isSeparator\(\)/);
assert.match(source, /\.serviceAction\s*=\s*serviceAction/);
assert.match(source, /if \(serviceAction\.noDisplay\(\)\)\s*\{\s*continue;/);

assert.match(source, /TaskContextMenuBackend::desktopActionsFromDescriptors/);
assert.match(source, /action->setText\(descriptor\.text\)/);
assert.match(source, /QIcon::fromTheme\(descriptor\.iconName\)/);
assert.match(source, /action->setSeparator\(descriptor\.separator\)/);
assert.match(
  source,
  /KIO::ApplicationLauncherJob\(descriptor\.serviceAction\)/,
);

assert.match(
  source,
  /const QList<DesktopActionDescriptor> descriptors\s*=\s*desktopActionDescriptors\(service->actions\(\)\);/,
);
assert.match(
  source,
  /return desktopActionsFromDescriptors\(descriptors,\s*parent\);/,
);
