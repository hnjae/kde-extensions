// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPackageDefinition as loadManifestPackageDefinition } from "./package-manifest.mjs";

const packageContentsDirName = "contents";
const metadataFileName = "metadata.json";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const defaultPackageDir = path.resolve(scriptDir, "..");

export function createInstalledPackageLayout(dataHome, definition) {
  const installRoot = path.join(
    dataHome,
    "kwin",
    "scripts",
    definition.pluginId,
  );

  return {
    installRoot,
    mainScriptPath: path.join(
      installRoot,
      packageContentsDirName,
      definition.mainScriptRelativePath,
    ),
    metadataPath: path.join(installRoot, metadataFileName),
  };
}

export function createPackageLayout(packageDir, definition) {
  const buildMainScriptPath = path.join(packageDir, "build", "src", "main.js");
  const packageJsonPath = path.join(packageDir, "package.json");
  const kpackageJsonPath = path.join(packageDir, "kpackage.json");
  const distRoot = path.join(packageDir, "dist", definition.packageName);
  const distMainScriptPath = path.join(
    distRoot,
    packageContentsDirName,
    definition.mainScriptRelativePath,
  );

  return {
    buildMainScriptPath,
    distMainScriptDir: path.dirname(distMainScriptPath),
    distMainScriptPath,
    distMetadataPath: path.join(distRoot, metadataFileName),
    distRoot,
    distRootUrl: pathToFileURL(`${distRoot}${path.sep}`),
    kpackageJsonPath,
    packageDir,
    packageJsonPath,
    ...definition,
  };
}

export async function loadPackageDefinition(packageDir = defaultPackageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");
  const kpackageJsonPath = path.join(packageDir, "kpackage.json");

  return loadManifestPackageDefinition(packageJsonPath, kpackageJsonPath);
}

export async function loadPackageLayout(packageDir = defaultPackageDir) {
  return createPackageLayout(
    packageDir,
    await loadPackageDefinition(packageDir),
  );
}
