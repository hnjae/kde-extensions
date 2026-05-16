// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const packageRoot = new URL("../dist/kwin-run-or-raise/", import.meta.url);
const bindingFields = ["Enabled", "Name", "DesktopEntryId", "Shortcut"];

function matchingCount(input: string, pattern: RegExp): number {
  return [...input.matchAll(pattern)].length;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

async function loadBindingSlots(): Promise<string[]> {
  const source = await readFile(
    new URL("../build/src/core.js", import.meta.url),
    "utf8",
  );
  const bindingSlots = vm.runInNewContext(
    `${source}
Array.from(
  { length: RunOrRaise.bindingCount },
  (_, index) => RunOrRaise.slotName(index + 1),
);`,
    {},
  ) as unknown;

  if (
    !Array.isArray(bindingSlots) ||
    bindingSlots.length === 0 ||
    bindingSlots.some((slot) => typeof slot !== "string")
  ) {
    throw new Error(
      "Failed to load binding slot schema from build/src/core.js",
    );
  }

  return bindingSlots;
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
  const bindingSlots = await loadBindingSlots();
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
    matchingCount(mainConfig, /<entry name="/g),
    bindingSlots.length * bindingFields.length,
  );
  assert.equal(
    matchingCount(configUi, /name="kcfg_/g),
    bindingSlots.length * bindingFields.length,
  );

  for (const slot of bindingSlots) {
    const escapedSlot = escapeRegExp(slot);

    for (const field of bindingFields) {
      assert.match(
        mainConfig,
        new RegExp(`<entry name="${escapedSlot}${field}"`),
      );
      assert.match(configUi, new RegExp(`name="kcfg_${escapedSlot}${field}"`));
    }
  }
});

test("main script is generated without module syntax", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});
