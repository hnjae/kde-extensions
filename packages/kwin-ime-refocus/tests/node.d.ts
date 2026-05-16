// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

declare module "node:assert/strict" {
  const assert: {
    doesNotMatch(actual: string, expected: RegExp, message?: string): void;
    equal(actual: unknown, expected: unknown, message?: string): void;
    match(actual: string, expected: RegExp, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
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
