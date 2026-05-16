// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const bundledScriptFileNames = Object.freeze(["refocus.js", "main.js"]);
const packageContentsDirName = "contents";
const metadataFileName = "metadata.json";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const defaultPackageDir = path.resolve(scriptDir, "..");

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function requiredString(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }

  return value;
}

function requiredRelativePath(value, fieldName) {
  const relativePath = requiredString(value, fieldName);
  const segments = relativePath.split("/");

  if (
    path.posix.isAbsolute(relativePath) ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new TypeError(`${fieldName} must be a relative package path`);
  }

  return relativePath;
}

function requiredObject(value, fieldName) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an object`);
  }

  return value;
}

export function createPackageMetadata(packageJson, kpackageJson) {
  const kplugin = requiredObject(kpackageJson.KPlugin, "KPlugin");

  return {
    ...kpackageJson,
    KPlugin: {
      ...kplugin,
      License: requiredString(packageJson.license, "package.json license"),
      Version: requiredString(packageJson.version, "package.json version"),
    },
  };
}

export function createPackageDefinition(packageJson, kpackageJson) {
  const kplugin = requiredObject(kpackageJson.KPlugin, "KPlugin");
  const packageName = requiredString(packageJson.name, "package.json name");
  const pluginId = requiredString(kplugin.Id, "KPlugin.Id");
  const mainScriptRelativePath = requiredRelativePath(
    kpackageJson["X-Plasma-MainScript"],
    "X-Plasma-MainScript",
  );

  return {
    kpackageJson,
    mainScriptRelativePath,
    metadata: createPackageMetadata(packageJson, kpackageJson),
    packageJson,
    packageName,
    pluginId,
  };
}

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
  const packageJsonPath = path.join(packageDir, "package.json");
  const kpackageJsonPath = path.join(packageDir, "kpackage.json");
  const buildScriptDir = path.join(packageDir, "build", "src");
  const distRoot = path.join(packageDir, "dist", definition.packageName);
  const distMainScriptPath = path.join(
    distRoot,
    packageContentsDirName,
    definition.mainScriptRelativePath,
  );

  return {
    buildScriptDir,
    bundledScriptPaths: bundledScriptFileNames.map((fileName) =>
      path.join(buildScriptDir, fileName),
    ),
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

  return createPackageDefinition(
    await readJsonFile(packageJsonPath),
    await readJsonFile(kpackageJsonPath),
  );
}

export async function loadPackageLayout(packageDir = defaultPackageDir) {
  return createPackageLayout(
    packageDir,
    await loadPackageDefinition(packageDir),
  );
}
