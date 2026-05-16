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
  bundledScriptFileNames,
  createBundledScriptPaths,
} from "../scripts/package-scripts.mjs";

async function readJson(url: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(url, "utf8")) as Record<string, unknown>;
}

const layout = await loadPackageLayout();
const packageRoot = layout.distRootUrl;

async function readBuiltMainScript(): Promise<string> {
  return readFile(layout.distMainScriptPath, "utf8");
}

function bundledScriptPaths(buildScriptDir: string): readonly string[] {
  return createBundledScriptPaths(buildScriptDir);
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
  assert.equal(syntheticLayout.distRoot, "/repo/example/dist/example-package");
  assert.equal(
    syntheticLayout.distMainScriptPath,
    "/repo/example/dist/example-package/contents/code/main.js",
  );
  assert.equal(
    syntheticLayout.distMetadataPath,
    "/repo/example/dist/example-package/metadata.json",
  );
  assert.deepEqual(bundledScriptPaths(syntheticLayout.buildScriptDir), [
    "/repo/example/build/src/refocus.js",
    "/repo/example/build/src/main.js",
  ]);
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
  const mainScript = await readBuiltMainScript();

  assert.match(mainScript, /registerShortcut\(/);
  assert.match(mainScript, /"IME Refocus"/);
  assert.match(mainScript, /"Recover IME focus for the active window"/);
  assert.match(mainScript, /""/);
  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});

test("main script packages configured source scripts in order", async () => {
  const mainScript = await readBuiltMainScript();
  const sourceScripts = await Promise.all(
    bundledScriptPaths(layout.buildScriptDir).map((scriptPath) =>
      readFile(scriptPath, "utf8"),
    ),
  );

  assert.deepEqual(bundledScriptFileNames, ["refocus.js", "main.js"]);

  let cursor = 0;

  for (const sourceScript of sourceScripts) {
    const scriptIndex = mainScript.indexOf(sourceScript, cursor);

    assert.notEqual(scriptIndex, -1);
    assert.ok(scriptIndex >= cursor);
    cursor = scriptIndex + sourceScript.length;
  }
});

test("main script delegates the shortcut callback to refocus policy", async () => {
  const mainScript = await readBuiltMainScript();

  assert.match(mainScript, /KWinImeRefocus\.recoverImeFocus\(workspace\)/);
});

test("main script avoids recovery side-effect APIs", async () => {
  const mainScript = await readBuiltMainScript();

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
