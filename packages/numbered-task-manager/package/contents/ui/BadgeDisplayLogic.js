// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function iconExtentForTaskHeight(taskHeight) {
  return Math.max(16, Math.min(32, Number(taskHeight || 0) - 8));
}

function badgePresentation(slotNumber, iconExtent) {
  if (slotNumber < 1 || slotNumber > 9) {
    return "none";
  }

  return iconExtent >= 24 ? "overlay" : "prefix";
}
