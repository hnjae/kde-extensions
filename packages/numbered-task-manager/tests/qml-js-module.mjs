// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export async function loadQmlJsModule(fileUrl, exportNames) {
  const module = await import(fileUrl.href);
  return Object.fromEntries(exportNames.map((name) => [name, module[name]]));
}
