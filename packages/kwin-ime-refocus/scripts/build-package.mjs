// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { loadPackageLayout } from "./package-layout.mjs";

const layout = await loadPackageLayout();

await rm(layout.distRoot, { force: true, recursive: true });
await mkdir(layout.distCodeDir, { recursive: true });

const mainScript = (
  await Promise.all(
    layout.bundledScriptPaths.map((scriptPath) => readFile(scriptPath, "utf8")),
  )
).join("\n");

await writeFile(layout.distMainScriptPath, mainScript);
await writeFile(
  layout.distMetadataPath,
  `${JSON.stringify(layout.metadata, null, 2)}\n`,
);
