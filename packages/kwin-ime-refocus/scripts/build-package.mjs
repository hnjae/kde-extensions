// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const buildScriptDir = path.join(packageDir, "build", "src");
const packageJson = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const kpackageJson = JSON.parse(
  await readFile(path.join(packageDir, "kpackage.json"), "utf8"),
);
const distRoot = path.join(packageDir, "dist", packageJson.name);
const distCodeDir = path.join(distRoot, "contents", "code");

const metadata = {
  ...kpackageJson,
  KPlugin: {
    ...kpackageJson.KPlugin,
    License: packageJson.license,
    Version: packageJson.version,
  },
};

await rm(distRoot, { force: true, recursive: true });
await mkdir(distCodeDir, { recursive: true });

const mainScript = (
  await Promise.all(
    ["refocus.js", "main.js"].map((fileName) =>
      readFile(path.join(buildScriptDir, fileName), "utf8"),
    ),
  )
).join("\n");

await writeFile(path.join(distCodeDir, "main.js"), mainScript);
await writeFile(
  path.join(distRoot, "metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
