// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createContext, runInContext } from "node:vm";
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
import {
  createWindow,
  createWorkspace,
  type WorkspaceFixture,
} from "./support/refocus-harness.js";

interface ShortcutRegistration {
  readonly title: string;
  readonly text: string;
  readonly keySequence: string;
  readonly callback: () => void;
}

async function readJson(url: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(url, "utf8")) as Record<string, unknown>;
}

const layout = await loadPackageLayout();
const packageRoot = layout.distRootUrl;

async function readPackagedMainScript(): Promise<string> {
  return readFile(layout.distMainScriptPath, "utf8");
}

async function runPackagedMainScript(
  workspace: WorkspaceFixture,
  extraSandbox: Record<string, unknown> = {},
): Promise<readonly ShortcutRegistration[]> {
  const shortcuts: ShortcutRegistration[] = [];
  const sandbox = {
    ...extraSandbox,
    registerShortcut(
      title: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ): boolean {
      shortcuts.push({ callback, keySequence, text, title });
      return true;
    },
    workspace,
  };

  createContext(sandbox);
  runInContext(await readPackagedMainScript(), sandbox);

  return shortcuts;
}

function singleShortcut(
  shortcuts: readonly ShortcutRegistration[],
): ShortcutRegistration {
  assert.equal(shortcuts.length, 1);

  const shortcut = shortcuts[0];
  if (shortcut === undefined) {
    throw new Error("shortcut was not registered");
  }

  return shortcut;
}

function assertThrowsTypeError(fn: () => unknown): void {
  assert.throws(fn, TypeError);
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
  assertThrowsTypeError(() =>
    createPackageDefinition(
      { license: "AGPL-3.0-or-later", name: "", version: "1.2.3" },
      {
        KPlugin: { Id: "example.plugin" },
        "X-Plasma-MainScript": "code/main.js",
      },
    ),
  );
  assertThrowsTypeError(() =>
    createPackageDefinition(
      {
        license: "AGPL-3.0-or-later",
        name: "example-package",
        version: "1.2.3",
      },
      {},
    ),
  );
  assertThrowsTypeError(() =>
    createPackageDefinition(
      {
        license: "AGPL-3.0-or-later",
        name: "example-package",
        version: "1.2.3",
      },
      { KPlugin: { Id: "example.plugin" } },
    ),
  );
  assertThrowsTypeError(() =>
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
  );
  assertThrowsTypeError(() =>
    createPackageDefinition(
      {
        license: "AGPL-3.0-or-later",
        name: "example-package",
        version: "1.2.3",
      },
      { KPlugin: { Id: "" }, "X-Plasma-MainScript": "code/main.js" },
    ),
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
  const shortcut = singleShortcut(
    await runPackagedMainScript(createWorkspace(null, null)),
  );

  assert.match(shortcut.title, /\bIME\b/i);
  assert.match(shortcut.title, /refocus|recover/i);
  assert.equal(shortcut.keySequence, "");
});

test("main script is copied from the compiler runtime bundle", async () => {
  const [compiledMainScript, packagedMainScript] = await Promise.all([
    readFile(layout.buildMainScriptPath, "utf8"),
    readPackagedMainScript(),
  ]);

  assert.equal(packagedMainScript, compiledMainScript);
});

test("registered shortcut callback recovers focus for the active window", async () => {
  const desktop = { id: "desktop-1" };
  const originalWindow = createWindow(desktop);
  const workspace = createWorkspace(originalWindow, desktop);
  const shortcut = singleShortcut(await runPackagedMainScript(workspace));

  shortcut.callback();

  assert.deepEqual(workspace.assignments, [null, originalWindow]);
  assert.equal(workspace.activeWindow, originalWindow);
});

test("registered shortcut callback avoids recovery side-effect APIs", async () => {
  const desktop = { id: "desktop-1" };
  const originalWindow = createWindow(desktop);
  const workspace = createWorkspace(originalWindow, desktop);
  const forbiddenApiNames = [
    "callDBus",
    "slotSwitch",
    "slotWindow",
    "setCurrentDesktop",
    "windowToDesktops",
    "sendClientToScreen",
  ];
  const forbiddenGlobals = Object.fromEntries(
    forbiddenApiNames.map((name) => [
      name,
      () => {
        throw new Error(`${name} must not be called during recovery`);
      },
    ]),
  );

  Object.defineProperty(workspace, "currentDesktop", {
    configurable: true,
    get: () => desktop,
    set: () => {
      throw new Error("currentDesktop must not be assigned during recovery");
    },
  });
  Object.defineProperties(originalWindow, {
    closeWindow: {
      configurable: true,
      value: () => {
        throw new Error("closeWindow must not be called during recovery");
      },
    },
    frameGeometry: {
      configurable: true,
      get: () => ({}),
      set: () => {
        throw new Error("frameGeometry must not be assigned during recovery");
      },
    },
    minimized: {
      configurable: true,
      get: () => false,
      set: () => {
        throw new Error("minimized must not be assigned during recovery");
      },
    },
  });

  const shortcut = singleShortcut(
    await runPackagedMainScript(workspace, forbiddenGlobals),
  );

  shortcut.callback();

  assert.deepEqual(workspace.assignments, [null, originalWindow]);
});
