// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function normalTaskModelFilterSettings() {
  return {
    filterByActivity: true,
    filterByScreen: false,
    filterByVirtualDesktop: true,
  };
}

function remoteAttentionModelFilterSettings() {
  return {
    filterByActivity: false,
    filterByScreen: false,
    filterByVirtualDesktop: false,
  };
}
