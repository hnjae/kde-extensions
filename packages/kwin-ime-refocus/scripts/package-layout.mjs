// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const bundledScriptFileNames = Object.freeze(["refocus.js", "main.js"]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function requiredString(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }

  return value;
}

export function createPackageMetadata(packageJson, kpackageJson) {
  return {
    ...kpackageJson,
    KPlugin: {
      ...kpackageJson.KPlugin,
      License: requiredString(packageJson.license, "package.json license"),
      Version: requiredString(packageJson.version, "package.json version"),
    },
  };
}

export function getInstalledPackagePaths(dataHome, pluginId) {
  const installRoot = path.join(dataHome, "kwin", "scripts", pluginId);

  return {
    installRoot,
    mainScriptPath: path.join(installRoot, "contents", "code", "main.js"),
    metadataPath: path.join(installRoot, "metadata.json"),
  };
}

export async function loadPackageLayout() {
  const packageJsonPath = path.join(packageDir, "package.json");
  const kpackageJsonPath = path.join(packageDir, "kpackage.json");
  const packageJson = await readJsonFile(packageJsonPath);
  const kpackageJson = await readJsonFile(kpackageJsonPath);
  const packageName = requiredString(packageJson.name, "package.json name");
  const pluginId = requiredString(kpackageJson.KPlugin?.Id, "KPlugin.Id");
  const buildScriptDir = path.join(packageDir, "build", "src");
  const distRoot = path.join(packageDir, "dist", packageName);
  const distCodeDir = path.join(distRoot, "contents", "code");

  return {
    buildScriptDir,
    bundledScriptPaths: bundledScriptFileNames.map((fileName) =>
      path.join(buildScriptDir, fileName),
    ),
    distCodeDir,
    distMainScriptPath: path.join(distCodeDir, "main.js"),
    distMetadataPath: path.join(distRoot, "metadata.json"),
    distRoot,
    distRootUrl: pathToFileURL(`${distRoot}${path.sep}`),
    kpackageJson,
    kpackageJsonPath,
    metadata: createPackageMetadata(packageJson, kpackageJson),
    packageDir,
    packageJson,
    packageJsonPath,
    packageName,
    pluginId,
  };
}
