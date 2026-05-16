// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { loadPackageLayout } from "./package-layout.mjs";

const layout = await loadPackageLayout();

await rm(layout.distRoot, { force: true, recursive: true });
await mkdir(layout.distMainScriptDir, { recursive: true });

await copyFile(layout.buildMainScriptPath, layout.distMainScriptPath);
await writeFile(
  layout.distMetadataPath,
  `${JSON.stringify(layout.metadata, null, 2)}\n`,
);
