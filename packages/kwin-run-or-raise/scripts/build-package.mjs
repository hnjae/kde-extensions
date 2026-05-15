// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const buildMain = path.join(packageDir, "build", "src", "main.js");
const distRoot = path.join(packageDir, "dist", "kwin-run-or-raise");
const distCodeDir = path.join(distRoot, "contents", "code");
const sourceConfigDir = path.join(packageDir, "src", "config");
const sourceUiDir = path.join(packageDir, "src", "ui");

const metadata = {
  KPackageStructure: "KWin/Script",
  KPlugin: {
    Authors: [
      {
        Name: "KIM Hyunjae",
      },
    ],
    Category: "Window Management",
    Description: "Run or raise configured applications with global shortcuts.",
    Icon: "preferences-system-windows",
    Id: "io.github.hnjae.kwin-run-or-raise",
    License: "AGPL-3.0-or-later",
    Name: "Run or Raise",
    Version: "0.1.0",
  },
  "X-Plasma-API": "javascript",
  "X-Plasma-MainScript": "code/main.js",
  "X-KDE-ConfigModule": "kcm_kwin4_genericscripted",
};

await rm(distRoot, { force: true, recursive: true });
await mkdir(distCodeDir, { recursive: true });
await copyFile(buildMain, path.join(distCodeDir, "main.js"));
await cp(sourceConfigDir, path.join(distRoot, "contents", "config"), {
  recursive: true,
});
await cp(sourceUiDir, path.join(distRoot, "contents", "ui"), {
  recursive: true,
});
await writeFile(
  path.join(distRoot, "metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
