// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export const nullActivityId = "00000000-0000-0000-0000-000000000000";

export function allActivitiesId() {
  return nullActivityId;
}

export function stringListContains(list, value) {
  const needle = String(value);
  const values = Array.from(list || []);
  for (let i = 0; i < values.length; ++i) {
    if (String(values[i]) === needle) {
      return true;
    }
  }

  return false;
}

export function uniqueStringList(list) {
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

export function activitiesAreAll(activities) {
  const activityList = Array.from(activities || []);
  return (
    activityList.length === 0 ||
    stringListContains(activityList, nullActivityId)
  );
}

export function normalizedActivityList(activities) {
  const activityList = uniqueStringList(activities);
  if (
    activityList.length === 0 ||
    stringListContains(activityList, nullActivityId)
  ) {
    return [nullActivityId];
  }

  return activityList;
}

export function isInCurrentActivity(activities, currentActivity) {
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
