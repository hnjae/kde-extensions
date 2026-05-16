// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(url: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(url, "utf8")) as Record<string, unknown>;
}

const packageJson = await readJson(new URL("../package.json", import.meta.url));
const packageRoot = new URL(`../dist/${packageJson.name}/`, import.meta.url);

test("build output has KWin script package structure", async () => {
  const metadata = await readJson(new URL("metadata.json", packageRoot));
  const kpackageJson = await readJson(
    new URL("../kpackage.json", import.meta.url),
  );

  assert.equal(metadata.KPackageStructure, kpackageJson.KPackageStructure);
  assert.equal(metadata["X-Plasma-API"], kpackageJson["X-Plasma-API"]);
  assert.equal(
    metadata["X-Plasma-MainScript"],
    kpackageJson["X-Plasma-MainScript"],
  );

  const plugin = metadata.KPlugin as Record<string, unknown>;
  const sourcePlugin = kpackageJson.KPlugin as Record<string, unknown>;

  assert.equal(plugin.Id, sourcePlugin.Id);
  assert.equal(plugin.Version, packageJson.version);
  assert.equal(plugin.License, packageJson.license);
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

test("main script packages refocus policy before shortcut registration", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  const policyIndex = mainScript.indexOf("var KWinImeRefocus;");
  const shortcutIndex = mainScript.indexOf("registerShortcut(");

  assert.notEqual(policyIndex, -1);
  assert.notEqual(shortcutIndex, -1);
  assert.ok(policyIndex < shortcutIndex);
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
