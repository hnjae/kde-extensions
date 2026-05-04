// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

type LogicExports = {
  greetingFor: (name: string) => string;
  normalizeName: (value: string) => string;
};

declare const module: { exports: LogicExports } | undefined;

function normalizeName(value: string): string {
  const normalized = value.trim();

  return normalized.length === 0 ? "Plasma" : normalized;
}

function greetingFor(name: string): string {
  return `Hello, ${normalizeName(name)}!`;
}

if (typeof module !== "undefined") {
  module.exports = {
    greetingFor,
    normalizeName,
  };
}
