// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  isOnCurrentVirtualDesktop,
  isRemoteVirtualDesktop,
} from "./VirtualDesktopLogic.mjs";

export function normalTaskModelFilterSettings() {
  return {
    filterByActivity: true,
    filterByScreen: false,
    filterByVirtualDesktop: true,
  };
}

export function remoteAttentionModelFilterSettings() {
  return {
    filterByActivity: false,
    filterByScreen: false,
    filterByVirtualDesktop: false,
  };
}

export function normalTaskQualifies(task, isInCurrentActivity, currentDesktop) {
  const entry = task || {};
  if (
    typeof isInCurrentActivity === "function" &&
    !isInCurrentActivity(entry.activities || [])
  ) {
    return false;
  }

  if (entry.isWindow) {
    return isOnCurrentVirtualDesktop(
      entry.virtualDesktops || [],
      entry.isOnAllVirtualDesktops,
      currentDesktop,
    );
  }

  return Boolean(entry.isLauncher || entry.isStartup);
}

export function remoteAttentionQualifies(
  task,
  isInCurrentActivity,
  currentDesktop,
) {
  const entry = task || {};
  return (
    Boolean(entry.isWindow) &&
    Boolean(entry.demandingAttention) &&
    (typeof isInCurrentActivity !== "function" ||
      isInCurrentActivity(entry.activities || [])) &&
    isRemoteVirtualDesktop(
      entry.virtualDesktops || [],
      entry.isOnAllVirtualDesktops,
      currentDesktop,
    )
  );
}
