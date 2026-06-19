// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";

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

export function parseSerializedLauncher(serializedLauncher) {
  const launcher = String(serializedLauncher || "");
  if (!launcher.startsWith("[")) {
    return {
      activities: [],
      url: launcher,
    };
  }

  const separator = launcher.indexOf("]\n");
  if (separator === -1) {
    return {
      activities: [],
      url: launcher,
    };
  }

  const activityText = launcher.slice(1, separator);
  return {
    activities: activityText
      ? activityText.split(",").filter((activityId) => activityId.length > 0)
      : [],
    url: launcher.slice(separator + 2),
  };
}

export function serializedLauncherActivities(serializedLauncher) {
  return parseSerializedLauncher(serializedLauncher).activities;
}

export function effectiveSerializedLauncherActivities(serializedLauncher) {
  return ActivityScopeLogic.normalizedActivityList(
    serializedLauncherActivities(serializedLauncher),
  );
}

export function serializedLauncherVisibleInActivity(
  serializedLauncher,
  currentActivity,
) {
  return ActivityScopeLogic.isInCurrentActivity(
    serializedLauncherActivities(serializedLauncher),
    currentActivity,
  );
}

export function serializeLauncherWithActivities(
  serializedLauncher,
  activities,
) {
  const parsed = parseSerializedLauncher(serializedLauncher);
  const activityList = ActivityScopeLogic.normalizedActivityList(activities);
  if (ActivityScopeLogic.activitiesAreAll(activityList)) {
    return parsed.url;
  }

  return `[${activityList.join(",")}]\n${parsed.url}`;
}

export function launcherActivitiesAfterAllToggle(
  launcherActivities,
  currentActivity,
) {
  if (ActivityScopeLogic.activitiesAreAll(launcherActivities)) {
    const current = String(currentActivity || "");
    return current ? [current] : null;
  }

  return [ActivityScopeLogic.allActivitiesId()];
}

export function launcherActivitiesAfterToggle(
  launcherActivities,
  activityId,
  currentActivity,
) {
  const activity = String(activityId || "");
  if (!activity) {
    return Array.from(launcherActivities || []);
  }

  const activityList = Array.from(launcherActivities || []).map((entry) =>
    String(entry),
  );
  if (ActivityScopeLogic.activitiesAreAll(activityList)) {
    return [activity];
  }

  if (ActivityScopeLogic.stringListContains(activityList, activity)) {
    const nextActivities = activityList.filter((entry) => entry !== activity);
    if (nextActivities.length > 0) {
      return nextActivities;
    }

    const current = String(currentActivity || "");
    return current ? [current] : activityList;
  }

  return activityList.concat([activity]);
}

export function launcherListWithActivitiesAt(
  launcherList,
  position,
  activities,
) {
  const launchers = normalizedLauncherList(launcherList);
  if (position < 0 || position >= launchers.length) {
    return null;
  }

  const result = launchers.slice();
  result[position] = serializeLauncherWithActivities(
    result[position],
    activities,
  );
  return result;
}

export function launcherActivityUpdate(launcherList, position, activities) {
  const currentLaunchers = normalizedLauncherList(launcherList);
  const nextLaunchers = launcherListWithActivitiesAt(
    currentLaunchers,
    position,
    activities,
  );
  if (!nextLaunchers) {
    return {
      activities: [],
      changed: false,
      launchers: currentLaunchers,
      ok: false,
      reason: "invalid-position",
    };
  }

  const changed = !launcherListsEqual(nextLaunchers, currentLaunchers);
  return {
    activities: effectiveSerializedLauncherActivities(nextLaunchers[position]),
    changed,
    launchers: nextLaunchers,
    ok: true,
    reason: changed ? "updated" : "unchanged",
  };
}

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
