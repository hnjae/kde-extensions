// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageRoot = new URL("../dist/kwin-run-or-raise/", import.meta.url);
const bindingCount = 16;

function matchingCount(input: string, pattern: RegExp): number {
  return [...input.matchAll(pattern)].length;
}

test("build output has KWin script package structure", async () => {
  const metadata = JSON.parse(
    await readFile(new URL("metadata.json", packageRoot), "utf8"),
  ) as Record<string, unknown>;

  assert.equal(metadata.KPackageStructure, "KWin/Script");
  assert.equal(metadata["X-Plasma-API"], "javascript");
  assert.equal(metadata["X-Plasma-MainScript"], "code/main.js");
  assert.equal(
    metadata["X-KDE-ConfigModule"],
    "kwin/effects/configs/kcm_kwin4_genericscripted",
  );

  const plugin = metadata.KPlugin as Record<string, unknown>;
  assert.equal(plugin.Id, "io.github.hnjae.kwin-run-or-raise");
  assert.equal(plugin.Version, "0.1.0");
  assert.equal(plugin.License, "AGPL-3.0-or-later");
});

test("build output includes script configuration files", async () => {
  const mainConfig = await readFile(
    new URL("contents/config/main.xml", packageRoot),
    "utf8",
  );
  const configUi = await readFile(
    new URL("contents/ui/config.ui", packageRoot),
    "utf8",
  );

  assert.match(mainConfig, /<group name="">/);
  assert.equal(
    matchingCount(mainConfig, /<entry name="Binding\d{2}Enabled"/g),
    bindingCount,
  );
  assert.equal(
    matchingCount(mainConfig, /<entry name="Binding\d{2}DesktopEntryId"/g),
    bindingCount,
  );
  assert.match(mainConfig, /<entry name="Binding16Shortcut" type="String">/);

  assert.equal(
    matchingCount(configUi, /name="kcfg_Binding\d{2}Enabled"/g),
    bindingCount,
  );
  assert.equal(
    matchingCount(configUi, /name="kcfg_Binding\d{2}DesktopEntryId"/g),
    bindingCount,
  );
  assert.match(configUi, /name="kcfg_Binding16Shortcut"/);
});

test("main script is generated without module syntax", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});
