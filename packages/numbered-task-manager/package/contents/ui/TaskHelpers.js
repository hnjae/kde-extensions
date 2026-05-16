// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

const nullActivityId = "00000000-0000-0000-0000-000000000000";

function stringListContains(list, value) {
  const needle = String(value);
  const values = Array.from(list || []);
  for (let i = 0; i < values.length; ++i) {
    if (String(values[i]) === needle) {
      return true;
    }
  }

  return false;
}

function normalizedLauncherList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter(
    (launcher) => launcher && launcher.length > 0,
  );
}

function launcherListsEqual(left, right) {
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

function uniqueStringList(list) {
  const result = [];
  const values = Array.from(list || []);
  for (let i = 0; i < values.length; ++i) {
    const value = String(values[i] || "");
    if (value.length === 0 || stringListContains(result, value)) {
      continue;
    }

    result.push(value);
  }

  return result;
}

function activitiesAreAll(activities) {
  const activityList = Array.from(activities || []);
  return (
    activityList.length === 0 ||
    stringListContains(activityList, nullActivityId)
  );
}

function normalizedActivityList(activities) {
  const activityList = uniqueStringList(activities);
  if (
    activityList.length === 0 ||
    stringListContains(activityList, nullActivityId)
  ) {
    return [nullActivityId];
  }

  return activityList;
}

function parseSerializedLauncher(serializedLauncher) {
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

function serializedLauncherActivities(serializedLauncher) {
  return parseSerializedLauncher(serializedLauncher).activities;
}

function effectiveSerializedLauncherActivities(serializedLauncher) {
  return normalizedActivityList(
    serializedLauncherActivities(serializedLauncher),
  );
}

function isInCurrentActivity(activities, currentActivity) {
  const current = String(currentActivity || "");
  if (!current) {
    return true;
  }

  const activityList = Array.from(activities || []);
  if (activitiesAreAll(activityList)) {
    return true;
  }

  return stringListContains(activityList, current);
}

function taskActivitiesAfterToggle(activities, activityId) {
  const activity = String(activityId || "");
  if (!activity) {
    return Array.from(activities || []);
  }

  const activityList = Array.from(activities || []).map((entry) =>
    String(entry),
  );
  if (activitiesAreAll(activityList)) {
    return [activity];
  }

  const nextActivities = [];
  let found = false;
  for (let i = 0; i < activityList.length; ++i) {
    if (activityList[i] === activity) {
      found = true;
    } else {
      nextActivities.push(activityList[i]);
    }
  }

  if (!found) {
    nextActivities.push(activity);
  }

  return nextActivities;
}

function serializedLauncherVisibleInActivity(
  serializedLauncher,
  currentActivity,
) {
  return isInCurrentActivity(
    serializedLauncherActivities(serializedLauncher),
    currentActivity,
  );
}

function serializeLauncherWithActivities(serializedLauncher, activities) {
  const parsed = parseSerializedLauncher(serializedLauncher);
  const activityList = normalizedActivityList(activities);
  if (activitiesAreAll(activityList)) {
    return parsed.url;
  }

  return "[" + activityList.join(",") + "]\n" + parsed.url;
}

function launcherActivitiesAfterAllToggle(launcherActivities, currentActivity) {
  if (activitiesAreAll(launcherActivities)) {
    const current = String(currentActivity || "");
    return current ? [current] : null;
  }

  return [nullActivityId];
}

function launcherActivitiesAfterToggle(
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
  if (activitiesAreAll(activityList)) {
    return [activity];
  }

  if (stringListContains(activityList, activity)) {
    const nextActivities = activityList.filter((entry) => entry !== activity);
    if (nextActivities.length > 0) {
      return nextActivities;
    }

    const current = String(currentActivity || "");
    return current ? [current] : activityList;
  }

  return activityList.concat([activity]);
}

function launcherListWithActivitiesAt(launcherList, position, activities) {
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
