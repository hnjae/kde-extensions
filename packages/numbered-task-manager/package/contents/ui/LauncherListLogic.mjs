// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parseSerializedLauncher } from "./LauncherActivityLogic.mjs";
import { launcherPositionForUrl } from "./LauncherPinLogic.mjs";

export function normalizedLauncherList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter(
    (launcher) => launcher && launcher.length > 0,
  );
}

export function launcherListsEqual(left, right) {
  const leftList = normalizedLauncherList(left);
  const rightList = normalizedLauncherList(right);
  if (leftList.length !== rightList.length) {
    return false;
  }

  for (let i = 0; i < leftList.length; ++i) {
    if (leftList[i] !== rightList[i]) {
      return false;
    }
  }

  return true;
}

export function pinnedLauncherGlobalPosition(
  launcherList,
  entry,
  launcherPosition,
) {
  const launcherUrl = entry
    ? String(entry.pinnedLauncherUrl || entry.launcherUrl || "")
    : "";
  if (!launcherUrl) {
    return -1;
  }

  const launchers = normalizedLauncherList(launcherList);
  const directPosition = launcherPositionForUrl(launcherUrl, launcherPosition);
  if (directPosition >= 0 && directPosition < launchers.length) {
    return directPosition;
  }

  for (let i = 0; i < launchers.length; ++i) {
    if (parseSerializedLauncher(launchers[i]).url === launcherUrl) {
      return i;
    }
  }

  return -1;
}

export function canMovePinnedLauncher(
  launcherList,
  sourceEntry,
  targetEntry,
  launcherPosition,
) {
  const sourcePosition = pinnedLauncherGlobalPosition(
    launcherList,
    sourceEntry,
    launcherPosition,
  );
  const targetPosition = pinnedLauncherGlobalPosition(
    launcherList,
    targetEntry,
    launcherPosition,
  );
  return (
    sourcePosition >= 0 &&
    targetPosition >= 0 &&
    sourcePosition !== targetPosition
  );
}

export function movePinnedLauncher(
  launcherList,
  sourceEntry,
  targetEntry,
  launcherPosition,
) {
  const launchers = normalizedLauncherList(launcherList);
  const sourcePosition = pinnedLauncherGlobalPosition(
    launchers,
    sourceEntry,
    launcherPosition,
  );
  const targetPosition = pinnedLauncherGlobalPosition(
    launchers,
    targetEntry,
    launcherPosition,
  );
  if (
    sourcePosition < 0 ||
    targetPosition < 0 ||
    sourcePosition === targetPosition ||
    sourcePosition >= launchers.length ||
    targetPosition >= launchers.length
  ) {
    return {
      moved: false,
      launchers,
    };
  }

  const nextLaunchers = launchers.slice();
  const movedLaunchers = nextLaunchers.splice(sourcePosition, 1);
  if (movedLaunchers.length !== 1) {
    return {
      moved: false,
      launchers,
    };
  }

  nextLaunchers.splice(targetPosition, 0, movedLaunchers[0]);
  return {
    moved: !launcherListsEqual(launchers, nextLaunchers),
    launchers: nextLaunchers,
  };
}
