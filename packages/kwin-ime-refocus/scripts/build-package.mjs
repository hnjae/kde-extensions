// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const buildMain = path.join(packageDir, "build", "src", "main.js");
const distRoot = path.join(packageDir, "dist", "kwin-ime-refocus");
const distCodeDir = path.join(distRoot, "contents", "code");

const metadata = {
  KPackageStructure: "KWin/Script",
  KPlugin: {
    Authors: [
      {
        Name: "KIM Hyunjae",
      },
    ],
    Category: "Window Management",
    Description:
      "Manually refocuses the active window to help recover IME input.",
    Icon: "preferences-system-windows",
    Id: "io.github.hnjae.kwin-ime-refocus",
    License: "AGPL-3.0-or-later",
    Name: "IME Refocus",
    Version: "0.1.0",
  },
  "X-Plasma-API": "javascript",
  "X-Plasma-MainScript": "code/main.js",
};

await rm(distRoot, { force: true, recursive: true });
await mkdir(distCodeDir, { recursive: true });
await copyFile(buildMain, path.join(distCodeDir, "main.js"));
await writeFile(
  path.join(distRoot, "metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
