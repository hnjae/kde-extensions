// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export const normalSlotLimit = 9;
export const metaZeroShortcutIndex = 9;

function integerValue(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

export function normalSlotNumberForIndex(index) {
  const normalIndex = integerValue(index, -1);
  return normalIndex >= 0 && normalIndex < normalSlotLimit
    ? normalIndex + 1
    : 0;
}

export function validSlotNumber(slotNumber) {
  const number = integerValue(slotNumber, 0);
  return number >= 1 && number <= normalSlotLimit ? number : 0;
}
