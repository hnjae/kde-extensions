// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import path from "node:path";

export const bundledScriptFileNames = Object.freeze(["refocus.js", "main.js"]);

export function createBundledScriptPaths(
  buildScriptDir,
  scriptFileNames = bundledScriptFileNames,
) {
  return scriptFileNames.map((fileName) => path.join(buildScriptDir, fileName));
}
