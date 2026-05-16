// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  bundledScriptFileNames,
  loadPackageLayout,
} from "../scripts/package-layout.mjs";

async function readJson(url: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(url, "utf8")) as Record<string, unknown>;
}

const layout = await loadPackageLayout();
const packageRoot = layout.distRootUrl;

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
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.match(mainScript, /registerShortcut\(/);
  assert.match(mainScript, /"IME Refocus"/);
  assert.match(mainScript, /"Recover IME focus for the active window"/);
  assert.match(mainScript, /""/);
  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});

test("main script packages configured source scripts in order", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );
  const sourceScripts = await Promise.all(
    layout.bundledScriptPaths.map((scriptPath) => readFile(scriptPath, "utf8")),
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
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.match(mainScript, /KWinImeRefocus\.recoverImeFocus\(workspace\)/);
});

test("main script avoids recovery side-effect APIs", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

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
