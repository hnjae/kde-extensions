// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageJson = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const kpackageJson = JSON.parse(
  await readFile(path.join(packageDir, "kpackage.json"), "utf8"),
);
const pluginId = kpackageJson.KPlugin.Id;
const distRoot = path.join(packageDir, "dist", packageJson.name);
const tempDir = await mkdtemp(
  path.join(os.tmpdir(), `${packageJson.name}-kpackage-`),
);
const dataHome = path.join(tempDir, "share");

try {
  await mkdir(dataHome, { recursive: true });

  const result = spawnSync(
    "kpackagetool6",
    ["--type=KWin/Script", "--install", distRoot],
    {
      env: {
        ...process.env,
        HOME: tempDir,
        XDG_DATA_HOME: dataHome,
      },
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  await access(
    path.join(dataHome, "kwin", "scripts", pluginId, "metadata.json"),
  );
  await access(
    path.join(
      dataHome,
      "kwin",
      "scripts",
      pluginId,
      "contents",
      "code",
      "main.js",
    ),
  );
} finally {
  await rm(tempDir, { force: true, recursive: true });
}
