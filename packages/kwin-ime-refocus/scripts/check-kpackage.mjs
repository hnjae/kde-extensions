// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getInstalledPackagePaths,
  loadPackageLayout,
} from "./package-layout.mjs";

const layout = await loadPackageLayout();
const tempDir = await mkdtemp(
  path.join(os.tmpdir(), `${layout.packageName}-kpackage-`),
);
const dataHome = path.join(tempDir, "share");

try {
  await mkdir(dataHome, { recursive: true });

  const result = spawnSync(
    "kpackagetool6",
    ["--type=KWin/Script", "--install", layout.distRoot],
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

  const installedPaths = getInstalledPackagePaths(dataHome, layout.pluginId);

  await access(installedPaths.metadataPath);
  await access(installedPaths.mainScriptPath);
} finally {
  await rm(tempDir, { force: true, recursive: true });
}
