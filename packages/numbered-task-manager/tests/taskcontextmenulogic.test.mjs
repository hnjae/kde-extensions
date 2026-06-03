// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = loadQmlJsModule(
  new URL("../package/contents/ui/TaskContextMenuLogic.js", import.meta.url),
  ["panelMenuPlacement"],
);

const plasmaCoreTypes = {
  BottomEdge: "bottom",
  LeftEdge: "left",
  RightEdge: "right",
  TopEdge: "top",
};

const plasmaMenu = {
  BottomPosedLeftAlignedPopup: "open-down",
  LeftPosedTopAlignedPopup: "open-left",
  RightPosedTopAlignedPopup: "open-right",
  TopPosedLeftAlignedPopup: "open-up",
};

assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.BottomEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.TopPosedLeftAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.TopEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.BottomPosedLeftAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.LeftEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.RightPosedTopAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(
    plasmaCoreTypes.RightEdge,
    plasmaCoreTypes,
    plasmaMenu,
  ),
  plasmaMenu.LeftPosedTopAlignedPopup,
);
assert.equal(
  logic.panelMenuPlacement(undefined, plasmaCoreTypes, plasmaMenu),
  plasmaMenu.TopPosedLeftAlignedPopup,
);

const menuQml = readFileSync(
  new URL("../package/contents/ui/TaskContextMenu.qml", import.meta.url),
  "utf8",
);

function directMenuContentObjectViolations(qml) {
  const violations = [];
  const menuStack = [];
  let depth = 0;

  for (const [index, line] of qml.split("\n").entries()) {
    const objectMatch = line.match(
      /^\s*(?:(?:readonly\s+)?property\s+[\w.]+\s+\w+\s*:\s*)?([\w.]+)\s*\{/,
    );
    const topMenu = menuStack.at(-1);

    if (
      objectMatch &&
      topMenu &&
      depth === topMenu.contentDepth &&
      objectMatch[1] !== "PlasmaExtras.MenuItem"
    ) {
      violations.push({
        line: index + 1,
        type: objectMatch[1],
      });
    }

    if (objectMatch && objectMatch[1] === "PlasmaExtras.Menu") {
      menuStack.push({
        contentDepth: depth + 1,
      });
    }

    for (const character of line) {
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        while (menuStack.length > 0 && depth < menuStack.at(-1).contentDepth) {
          menuStack.pop();
        }
      }
    }
  }

  return violations;
}

assert.deepEqual(directMenuContentObjectViolations(menuQml), []);
