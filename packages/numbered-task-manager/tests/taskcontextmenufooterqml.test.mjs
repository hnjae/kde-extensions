// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sourceQml = readFileSync(
  new URL("../package/contents/ui/TaskContextMenu.qml", import.meta.url),
  "utf8",
);

assert.match(
  sourceQml,
  /import "TaskContextMenuFooterLogic\.mjs" as TaskContextMenuFooterLogic/,
);
assert.match(
  sourceQml,
  /TaskContextMenuFooterLogic\.contextMenuFooterAction\("configureWidget"/,
);
assert.match(
  sourceQml,
  /TaskContextMenuFooterLogic\.contextMenuFooterAction\("editMode"/,
);
assert.match(
  sourceQml,
  /TaskContextMenuFooterLogic\.contextMenuFooterSection\(/,
);
assert.match(
  sourceQml,
  /TaskContextMenuFooterLogic\.executeContextMenuFooterAction\(/,
);
assert.doesNotMatch(sourceQml, /configureAction\.trigger\(\)/);
assert.doesNotMatch(sourceQml, /editModeAction\.trigger\(\)/);
assert.doesNotMatch(
  sourceQml,
  /PlasmaExtras\.MenuItem\s*\{\s*separator:\s*true\s*\}/,
);
