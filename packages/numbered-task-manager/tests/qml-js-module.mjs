// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";

function runQmlJsFile(fileUrl, context) {
  const source = readFileSync(fileUrl, "utf8");
  const previousInclude = context.Qt.include;
  context.Qt.include = (relativePath) => {
    runQmlJsFile(new URL(relativePath, fileUrl), context);
    return { status: 0 };
  };

  const script = new Script(source, {
    filename: fileUrl.pathname,
  });
  script.runInContext(context);
  context.Qt.include = previousInclude;
}

export function loadQmlJsModule(fileUrl, exportNames) {
  const exportSource = `
globalThis.__exports = {
${exportNames.map((name) => `  ${name}: ${name},`).join("\n")}
};
`;
  const context = createContext({
    console,
    Qt: {
      include: () => ({ status: 1 }),
    },
  });

  runQmlJsFile(fileUrl, context);
  const exportScript = new Script(exportSource, {
    filename: fileUrl.pathname,
  });

  exportScript.runInContext(context);
  return context.__exports;
}
