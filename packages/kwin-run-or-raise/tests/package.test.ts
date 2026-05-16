// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const packageRoot = new URL("../dist/kwin-run-or-raise/", import.meta.url);

type BindingConfigField = {
  defaultValue: boolean | string;
  label: string;
  name: string;
  valueType: string;
  widgetClass: string;
};

type BindingSchema = {
  fields: BindingConfigField[];
  slots: string[];
};

function matchingCount(input: string, pattern: RegExp): number {
  return [...input.matchAll(pattern)].length;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

async function loadBindingSchema(): Promise<BindingSchema> {
  const source = await readFile(
    new URL("../build/src/core.js", import.meta.url),
    "utf8",
  );
  const bindingSchema = vm.runInNewContext(
    `${source}
({
  fields: RunOrRaise.bindingConfigFields,
  slots: RunOrRaise.bindingSlotNames(),
});`,
    {},
  ) as unknown;

  if (
    typeof bindingSchema !== "object" ||
    bindingSchema === null ||
    !("fields" in bindingSchema) ||
    !("slots" in bindingSchema) ||
    !Array.isArray(bindingSchema.fields) ||
    !Array.isArray(bindingSchema.slots) ||
    bindingSchema.slots.length === 0 ||
    bindingSchema.fields.length === 0 ||
    bindingSchema.slots.some((slot) => typeof slot !== "string") ||
    bindingSchema.fields.some(
      (field) =>
        typeof field !== "object" ||
        field === null ||
        typeof field.name !== "string" ||
        typeof field.label !== "string" ||
        typeof field.valueType !== "string" ||
        typeof field.widgetClass !== "string",
    )
  ) {
    throw new Error("Failed to load binding schema from build/src/core.js");
  }

  return bindingSchema as BindingSchema;
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

test("main script is generated without module syntax", async () => {
  const mainScript = await readFile(
    new URL("contents/code/main.js", packageRoot),
    "utf8",
  );

  assert.doesNotMatch(mainScript, /export\s+\{\};/);
});
