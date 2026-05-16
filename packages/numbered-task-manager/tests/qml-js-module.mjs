// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";

export function loadQmlJsModule(fileUrl, exportNames) {
  const source = readFileSync(fileUrl, "utf8");
  const exportSource = `
globalThis.__exports = {
${exportNames.map((name) => `  ${name}: ${name},`).join("\n")}
};
`;
  const context = createContext({
    console,
  });
  const script = new Script(`${source}\n${exportSource}`, {
    filename: fileUrl.pathname,
  });

  script.runInContext(context);
  return context.__exports;
}
