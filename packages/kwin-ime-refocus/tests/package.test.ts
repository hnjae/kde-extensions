// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createInstalledPackageLayout,
  createPackageLayout,
  loadPackageLayout,
} from "../scripts/package-layout.mjs";
import { createPackageDefinition } from "../scripts/package-manifest.mjs";
import {
  buildPackage,
  checkKPackageInstall,
  KPackageInstallError,
} from "../scripts/package-operations.mjs";

async function readJson(url: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(url, "utf8")) as Record<string, unknown>;
}

const layout = await loadPackageLayout();
const packageRoot = layout.distRootUrl;

async function readPackagedMainScript(): Promise<string> {
  return readFile(layout.distMainScriptPath, "utf8");
}

test("package definition validates manifests and derives generated metadata", () => {
  const packageJson = {
    license: "AGPL-3.0-or-later",
    name: "example-package",
    version: "1.2.3",
  };
  const kpackageJson = {
    KPackageStructure: "KWin/Script",
    KPlugin: {
      Description: "Example",
      Id: "example.plugin",
      Name: "Example Plugin",
    },
    "X-Plasma-MainScript": "code/main.js",
  };

  const definition = createPackageDefinition(packageJson, kpackageJson);

  assert.equal(definition.mainScriptRelativePath, "code/main.js");
  assert.equal(definition.packageName, "example-package");
  assert.equal(definition.pluginId, "example.plugin");
  assert.deepEqual(definition.metadata, {
    ...kpackageJson,
    KPlugin: {
      ...kpackageJson.KPlugin,
      License: "AGPL-3.0-or-later",
      Version: "1.2.3",
    },
  });
});

test("package definition rejects incomplete manifest fields", () => {
  assert.throws(
    () =>
      createPackageDefinition(
        { license: "AGPL-3.0-or-later", name: "", version: "1.2.3" },
        {
          KPlugin: { Id: "example.plugin" },
          "X-Plasma-MainScript": "code/main.js",
        },
      ),
    /package\.json name must be a non-empty string/,
  );
  assert.throws(
    () =>
      createPackageDefinition(
        {
          license: "AGPL-3.0-or-later",
          name: "example-package",
          version: "1.2.3",
        },
        {},
      ),
    /KPlugin must be an object/,
  );
  assert.throws(
    () =>
      createPackageDefinition(
        {
          license: "AGPL-3.0-or-later",
          name: "example-package",
          version: "1.2.3",
        },
        { KPlugin: { Id: "example.plugin" } },
      ),
    /X-Plasma-MainScript must be a non-empty string/,
  );
  assert.throws(
    () =>
      createPackageDefinition(
        {
          license: "AGPL-3.0-or-later",
          name: "example-package",
          version: "1.2.3",
        },
        {
          KPlugin: { Id: "example.plugin" },
          "X-Plasma-MainScript": "../main.js",
        },
      ),
    /X-Plasma-MainScript must be a relative package path/,
  );
  assert.throws(
    () =>
      createPackageDefinition(
        {
          license: "AGPL-3.0-or-later",
          name: "example-package",
          version: "1.2.3",
        },
        { KPlugin: { Id: "" }, "X-Plasma-MainScript": "code/main.js" },
      ),
    /KPlugin\.Id must be a non-empty string/,
  );
});

test("package layout derives all generated paths from the package definition", () => {
  const definition = createPackageDefinition(
    {
      license: "AGPL-3.0-or-later",
      name: "example-package",
      version: "1.2.3",
    },
    {
      KPlugin: { Id: "example.plugin" },
      "X-Plasma-MainScript": "code/main.js",
    },
  );

  const syntheticLayout = createPackageLayout("/repo/example", definition);
  const installedLayout = createInstalledPackageLayout(
    "/home/example/.local/share",
    definition,
  );

  assert.equal(syntheticLayout.packageDir, "/repo/example");
  assert.equal(
    syntheticLayout.buildMainScriptPath,
    "/repo/example/build/src/main.js",
  );
  assert.equal(syntheticLayout.distRoot, "/repo/example/dist/example-package");
  assert.equal(
    syntheticLayout.distMainScriptPath,
    "/repo/example/dist/example-package/contents/code/main.js",
  );
  assert.equal(
    syntheticLayout.distMetadataPath,
    "/repo/example/dist/example-package/metadata.json",
  );
  assert.equal(
    installedLayout.mainScriptPath,
    "/home/example/.local/share/kwin/scripts/example.plugin/contents/code/main.js",
  );
  assert.equal(
    installedLayout.metadataPath,
    "/home/example/.local/share/kwin/scripts/example.plugin/metadata.json",
  );
});

test("package layout follows the manifest main script path", () => {
  const definition = createPackageDefinition(
    {
      license: "AGPL-3.0-or-later",
      name: "example-package",
      version: "1.2.3",
    },
    {
      KPlugin: { Id: "example.plugin" },
      "X-Plasma-MainScript": "scripts/start.js",
    },
  );

  const syntheticLayout = createPackageLayout("/repo/example", definition);
  const installedLayout = createInstalledPackageLayout(
    "/home/example/.local/share",
    definition,
  );

  assert.equal(
    syntheticLayout.distMainScriptPath,
    "/repo/example/dist/example-package/contents/scripts/start.js",
  );
  assert.equal(
    installedLayout.mainScriptPath,
    "/home/example/.local/share/kwin/scripts/example.plugin/contents/scripts/start.js",
  );
});

test("package build operation writes generated package files through layout paths", async () => {
  const definition = createPackageDefinition(
    {
      license: "AGPL-3.0-or-later",
      name: "example-package",
      version: "1.2.3",
    },
    {
      KPlugin: { Id: "example.plugin" },
      "X-Plasma-MainScript": "code/main.js",
    },
  );
  const syntheticLayout = createPackageLayout("/repo/example", definition);
  const calls: unknown[] = [];

  await buildPackage(syntheticLayout, {
    async copyFile(source: string, destination: string): Promise<void> {
      calls.push(["copyFile", source, destination]);
    },
    async mkdir(directory: string, options: unknown): Promise<void> {
      calls.push(["mkdir", directory, options]);
    },
    async rm(directory: string, options: unknown): Promise<void> {
      calls.push(["rm", directory, options]);
    },
    async writeFile(filePath: string, contents: string): Promise<void> {
      calls.push(["writeFile", filePath, contents]);
    },
  });

  assert.deepEqual(calls, [
    [
      "rm",
      "/repo/example/dist/example-package",
      { force: true, recursive: true },
    ],
    [
      "mkdir",
      "/repo/example/dist/example-package/contents/code",
      { recursive: true },
    ],
    [
      "copyFile",
      "/repo/example/build/src/main.js",
      "/repo/example/dist/example-package/contents/code/main.js",
    ],
    [
      "writeFile",
      "/repo/example/dist/example-package/metadata.json",
      `${JSON.stringify(definition.metadata, null, 2)}\n`,
    ],
  ]);
});

test("package install check runs kpackagetool in an isolated data home", async () => {
  const definition = createPackageDefinition(
    {
      license: "AGPL-3.0-or-later",
      name: "example-package",
      version: "1.2.3",
    },
    {
      KPlugin: { Id: "example.plugin" },
      "X-Plasma-MainScript": "code/main.js",
    },
  );
  const syntheticLayout = createPackageLayout("/repo/example", definition);
  const calls: unknown[] = [];

  await checkKPackageInstall(syntheticLayout, {
    async access(filePath: string): Promise<void> {
      calls.push(["access", filePath]);
    },
    env: { PATH: "/bin" },
    async mkdir(directory: string, options: unknown): Promise<void> {
      calls.push(["mkdir", directory, options]);
    },
    async mkdtemp(prefix: string): Promise<string> {
      calls.push(["mkdtemp", prefix]);
      return "/tmp/example-package-kpackage-generated";
    },
    async rm(directory: string, options: unknown): Promise<void> {
      calls.push(["rm", directory, options]);
    },
    spawnSync(
      command: string,
      args: readonly string[],
      options: unknown,
    ): { status: number } {
      calls.push(["spawnSync", command, args, options]);
      return { status: 0 };
    },
    tmpdir: () => "/tmp",
  });

  assert.deepEqual(calls, [
    ["mkdtemp", "/tmp/example-package-kpackage-"],
    [
      "mkdir",
      "/tmp/example-package-kpackage-generated/share",
      { recursive: true },
    ],
    [
      "spawnSync",
      "kpackagetool6",
      ["--type=KWin/Script", "--install", syntheticLayout.distRoot],
      {
        env: {
          PATH: "/bin",
          HOME: "/tmp/example-package-kpackage-generated",
          XDG_DATA_HOME: "/tmp/example-package-kpackage-generated/share",
        },
        stdio: "inherit",
      },
    ],
    [
      "access",
      "/tmp/example-package-kpackage-generated/share/kwin/scripts/example.plugin/metadata.json",
    ],
    [
      "access",
      "/tmp/example-package-kpackage-generated/share/kwin/scripts/example.plugin/contents/code/main.js",
    ],
    [
      "rm",
      "/tmp/example-package-kpackage-generated",
      { force: true, recursive: true },
    ],
  ]);
});

test("package install check reports installer failures and still cleans up", async () => {
  const definition = createPackageDefinition(
    {
      license: "AGPL-3.0-or-later",
      name: "example-package",
      version: "1.2.3",
    },
    {
      KPlugin: { Id: "example.plugin" },
      "X-Plasma-MainScript": "code/main.js",
    },
  );
  const syntheticLayout = createPackageLayout("/repo/example", definition);
  const calls: unknown[] = [];

  await assert.rejects(
    () =>
      checkKPackageInstall(syntheticLayout, {
        async access(): Promise<void> {
          calls.push(["access"]);
        },
        async mkdir(): Promise<void> {
          calls.push(["mkdir"]);
        },
        async mkdtemp(): Promise<string> {
          calls.push(["mkdtemp"]);
          return "/tmp/example-package-kpackage-generated";
        },
        async rm(directory: string, options: unknown): Promise<void> {
          calls.push(["rm", directory, options]);
        },
        spawnSync(): { status: number } {
          calls.push(["spawnSync"]);
          return { status: 17 };
        },
        tmpdir: () => "/tmp",
      }),
    KPackageInstallError,
  );

  assert.deepEqual(calls, [
    ["mkdtemp"],
    ["mkdir"],
    ["spawnSync"],
    [
      "rm",
      "/tmp/example-package-kpackage-generated",
      { force: true, recursive: true },
    ],
  ]);
});

test("build output has KWin script package structure", async () => {
  const metadata = await readJson(new URL("metadata.json", packageRoot));

  assert.deepEqual(metadata, layout.metadata);
  assert.equal(
    metadata.KPackageStructure,
    layout.kpackageJson.KPackageStructure,
  );
  assert.equal(metadata["X-Plasma-API"], layout.kpackageJson["X-Plasma-API"]);
  assert.equal(
    metadata["X-Plasma-MainScript"],
    layout.kpackageJson["X-Plasma-MainScript"],
  );

  const plugin = metadata.KPlugin as Record<string, unknown>;
  const sourcePlugin = layout.kpackageJson.KPlugin as Record<string, unknown>;

  assert.equal(plugin.Id, sourcePlugin.Id);
  assert.equal(plugin.Version, layout.packageJson.version);
  assert.equal(plugin.License, layout.packageJson.license);
});

test("main script registers an unbound IME recovery shortcut", async () => {
  const mainScript = await readPackagedMainScript();

  assert.match(mainScript, /registerShortcut\(/);
  assert.match(mainScript, /"IME Refocus"/);
  assert.match(mainScript, /"Recover IME focus for the active window"/);
  assert.match(mainScript, /""/);
  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});

test("main script is copied from the compiler runtime bundle", async () => {
  const [compiledMainScript, packagedMainScript] = await Promise.all([
    readFile(layout.buildMainScriptPath, "utf8"),
    readPackagedMainScript(),
  ]);

  assert.equal(packagedMainScript, compiledMainScript);
});

test("main script delegates the shortcut callback to refocus policy", async () => {
  const mainScript = await readPackagedMainScript();

  assert.match(mainScript, /KWinImeRefocus\.recoverImeFocus\(workspace\)/);
});

test("main script avoids recovery side-effect APIs", async () => {
  const mainScript = await readPackagedMainScript();

  assert.doesNotMatch(mainScript, /callDBus/);
  assert.doesNotMatch(mainScript, /slotSwitch/);
  assert.doesNotMatch(mainScript, /slotWindow/);
  assert.doesNotMatch(mainScript, /setCurrentDesktop/);
  assert.doesNotMatch(mainScript, /windowToDesktops/);
  assert.doesNotMatch(mainScript, /sendClientToScreen/);
  assert.doesNotMatch(mainScript, /workspace\.currentDesktop\s*=/);
  assert.doesNotMatch(mainScript, /frameGeometry\s*=/);
  assert.doesNotMatch(mainScript, /\.minimized\s*=/);
  assert.doesNotMatch(mainScript, /\.closeWindow\(/);
});
