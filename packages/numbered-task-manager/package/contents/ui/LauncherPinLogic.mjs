// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { serializedLauncherVisibleInActivity } from "./LauncherActivityLogic.mjs";
import { normalizedLauncherList } from "./LauncherListLogic.mjs";

export function launcherPositionForUrl(launcherUrl, launcherPosition) {
  const url = String(launcherUrl || "");
  if (!url) {
    return -1;
  }

  const position =
    typeof launcherPosition === "function"
      ? launcherPosition(url)
      : launcherPosition;
  if (position === undefined || position === null) {
    return -1;
  }

  const numericPosition = Number(position);
  return Number.isNaN(numericPosition) ? -1 : numericPosition;
}

export function visibleLauncherPosition(
  launcherList,
  launcherUrl,
  currentActivity,
  launcherPosition,
) {
  const launchers = normalizedLauncherList(launcherList);
  const globalPosition = launcherPositionForUrl(launcherUrl, launcherPosition);
  if (globalPosition < 0 || globalPosition >= launchers.length) {
    return -1;
  }

  let visiblePosition = 0;
  for (let i = 0; i < launchers.length && i <= globalPosition; ++i) {
    if (!serializedLauncherVisibleInActivity(launchers[i], currentActivity)) {
      continue;
    }

    if (i === globalPosition) {
      return visiblePosition;
    }

    visiblePosition += 1;
  }

  return -1;
}

export function launcherPinState(
  launcherList,
  launcherUrl,
  currentActivity,
  launcherPosition,
) {
  const url = String(launcherUrl || "");
  const pinnedLauncherPosition = visibleLauncherPosition(
    launcherList,
    url,
    currentActivity,
    launcherPosition,
  );

  return {
    canPin: url.length > 0,
    isPinned: pinnedLauncherPosition !== -1,
    launcherUrl: url,
    pinnedLauncherPosition,
  };
}
