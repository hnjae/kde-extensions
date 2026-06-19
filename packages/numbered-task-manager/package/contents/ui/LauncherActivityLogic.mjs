// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";
import {
  launcherListsEqual,
  normalizedLauncherList,
} from "./LauncherListLogic.mjs";

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
