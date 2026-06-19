// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function actionResult(action, code, ok, diagnostic, context) {
  return {
    action,
    code,
    context: Object.assign({}, context || {}),
    diagnostic: Boolean(diagnostic),
    ok: Boolean(ok),
  };
}

export function shouldLogActionResult(result) {
  return Boolean(result && !result.ok && result.diagnostic);
}
