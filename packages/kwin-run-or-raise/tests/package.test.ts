// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadBindingSchema } from "./support/run-or-raise.js";

const packageRoot = new URL("../dist/kwin-run-or-raise/", import.meta.url);

function matchingCount(input: string, pattern: RegExp): number {
  return [...input.matchAll(pattern)].length;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
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
  assert.equal(plugin.Id, "org.hnjae.kwin-run-or-raise");
  assert.equal(plugin.Version, "0.1.0");
  assert.equal(plugin.License, "AGPL-3.0-or-later");
});

test("build output includes script configuration files", async () => {
  const bindingSchema = await loadBindingSchema();
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
    bindingSchema.slots.length * bindingSchema.fields.length,
  );
  assert.equal(
    matchingCount(configUi, /name="kcfg_/g),
    bindingSchema.slots.length * bindingSchema.fields.length,
  );

  for (const slot of bindingSchema.slots) {
    const escapedSlot = escapeRegExp(slot);

    for (const field of bindingSchema.fields) {
      const escapedField = escapeRegExp(field.name);

      assert.match(
        mainConfig,
        new RegExp(
          `<entry name="${escapedSlot}${escapedField}" type="${escapeRegExp(
            field.valueType,
          )}"`,
        ),
      );
      assert.match(
        configUi,
        new RegExp(
          `<widget class="${escapeRegExp(
            field.widgetClass,
          )}" name="kcfg_${escapedSlot}${escapedField}"`,
        ),
      );
    }
  }
});
