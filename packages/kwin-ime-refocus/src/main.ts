// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
  registerShortcut(
    "IME Refocus",
    "Recover IME focus for the active window",
    "",
    () => {
      KWinImeRefocus.recoverImeFocus(workspace);
    },
  );
})();
