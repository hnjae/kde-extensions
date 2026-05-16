// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

declare module "node:assert/strict" {
  const assert: {
    doesNotMatch(actual: string, expected: RegExp, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    equal(actual: unknown, expected: unknown, message?: string): void;
    match(actual: string, expected: RegExp, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    throws(fn: () => unknown, expected?: RegExp, message?: string): void;
  };

  export default assert;
}

declare module "node:fs/promises" {
  export function readFile(
    path: string | URL,
    encoding: "utf8",
  ): Promise<string>;
}

declare module "node:test" {
  export default function test(
    name: string,
    fn: () => Promise<void> | void,
  ): void;
}

declare module "node:vm" {
  export function createContext<T extends object>(contextObject: T): T;
  export function runInContext(
    code: string,
    contextifiedObject: object,
  ): unknown;
}

declare module "*.mjs" {
  interface PackageDefinition {
    readonly kpackageJson: Record<string, unknown>;
    readonly mainScriptRelativePath: string;
    readonly metadata: Record<string, unknown>;
    readonly packageJson: Record<string, unknown>;
    readonly packageName: string;
    readonly pluginId: string;
  }

  interface InstalledPackageLayout {
    readonly installRoot: string;
    readonly mainScriptPath: string;
    readonly metadataPath: string;
  }

  interface PackageLayout {
    readonly buildScriptDir: string;
    readonly distMainScriptDir: string;
    readonly distMainScriptPath: string;
    readonly distMetadataPath: string;
    readonly distRoot: string;
    readonly distRootUrl: URL;
    readonly kpackageJson: Record<string, unknown>;
    readonly metadata: Record<string, unknown>;
    readonly packageDir: string;
    readonly packageJson: Record<string, unknown>;
  }

  export const bundledScriptFileNames: readonly string[];
  export function createBundledScriptPaths(
    buildScriptDir: string,
    scriptFileNames?: readonly string[],
  ): readonly string[];
  export function createInstalledPackageLayout(
    dataHome: string,
    definition: PackageDefinition,
  ): InstalledPackageLayout;
  export function createPackageDefinition(
    packageJson: Record<string, unknown>,
    kpackageJson: Record<string, unknown>,
  ): PackageDefinition;
  export function createPackageLayout(
    packageDir: string,
    definition: PackageDefinition,
  ): PackageLayout;
  export function loadPackageLayout(): Promise<PackageLayout>;
}
