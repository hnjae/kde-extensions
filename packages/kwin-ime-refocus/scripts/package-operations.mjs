// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { spawnSync as defaultSpawnSync } from "node:child_process";
import {
  access as defaultAccess,
  copyFile as defaultCopyFile,
  mkdir as defaultMkdir,
  mkdtemp as defaultMkdtemp,
  rm as defaultRm,
  writeFile as defaultWriteFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInstalledPackageLayout } from "./package-layout.mjs";

export class KPackageInstallError extends Error {
  constructor(exitCode) {
    super(`kpackagetool6 failed with exit code ${exitCode}`);
    this.name = "KPackageInstallError";
    this.exitCode = exitCode;
  }
}

export async function buildPackage(layout, operations = {}) {
  const {
    copyFile = defaultCopyFile,
    mkdir = defaultMkdir,
    rm = defaultRm,
    writeFile = defaultWriteFile,
  } = operations;

  await rm(layout.distRoot, { force: true, recursive: true });
  await mkdir(layout.distMainScriptDir, { recursive: true });

  await copyFile(layout.buildMainScriptPath, layout.distMainScriptPath);
  await writeFile(
    layout.distMetadataPath,
    `${JSON.stringify(layout.metadata, null, 2)}\n`,
  );
}

export async function checkKPackageInstall(layout, operations = {}) {
  const {
    access = defaultAccess,
    env = process.env,
    mkdir = defaultMkdir,
    mkdtemp = defaultMkdtemp,
    rm = defaultRm,
    spawnSync = defaultSpawnSync,
    tmpdir = os.tmpdir,
  } = operations;
  const tempDir = await mkdtemp(
    path.join(tmpdir(), `${layout.packageName}-kpackage-`),
  );
  const dataHome = path.join(tempDir, "share");

  try {
    await mkdir(dataHome, { recursive: true });

    const result = spawnSync(
      "kpackagetool6",
      ["--type=KWin/Script", "--install", layout.distRoot],
      {
        env: {
          ...env,
          HOME: tempDir,
          XDG_DATA_HOME: dataHome,
        },
        stdio: "inherit",
      },
    );

    if (result.status !== 0) {
      throw new KPackageInstallError(result.status ?? 1);
    }

    const installedPaths = createInstalledPackageLayout(dataHome, layout);

    await access(installedPaths.metadataPath);
    await access(installedPaths.mainScriptPath);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
