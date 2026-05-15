// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageRoot = new URL("../dist/kwin-ime-refocus/", import.meta.url);

test("build output has KWin script package structure", async () => {
  const metadata = JSON.parse(
    await readFile(new URL("metadata.json", packageRoot), "utf8"),
  ) as Record<string, unknown>;

  assert.equal(metadata.KPackageStructure, "KWin/Script");
  assert.equal(metadata["X-Plasma-API"], "javascript");
  assert.equal(metadata["X-Plasma-MainScript"], "code/main.js");

  const plugin = metadata.KPlugin as Record<string, unknown>;
  assert.equal(plugin.Id, "io.github.hnjae.kwin-ime-refocus");
  assert.equal(plugin.Version, "0.1.0");
  assert.equal(plugin.License, "AGPL-3.0-or-later");
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

test("main script clears focus before restoring the original window", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  const clearFocusIndex = mainScript.indexOf("workspace.activeWindow = null;");
  const restoreFocusIndex = mainScript.indexOf(
    "workspace.activeWindow = originalWindow;",
  );

  assert.notEqual(clearFocusIndex, -1);
  assert.notEqual(restoreFocusIndex, -1);
  assert.ok(clearFocusIndex < restoreFocusIndex);
});

test("main script only restores the original window on the original desktop", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.match(mainScript, /const originalWindow = workspace\.activeWindow;/);
  assert.match(
    mainScript,
    /const originalDesktop = workspace\.currentDesktop;/,
  );
  assert.match(
    mainScript,
    /isSameDesktop\(workspace\.currentDesktop, originalDesktop\)/,
  );
  assert.match(
    mainScript,
    /canRefocusWindow\(originalWindow, originalDesktop\)/,
  );
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
