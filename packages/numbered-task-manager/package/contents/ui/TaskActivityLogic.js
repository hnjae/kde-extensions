// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

Qt.include("ActivityScopeLogic.js");

function allActivitiesId() {
  return ActivityScopeLogic.allActivitiesId();
}

function stringListContains(list, value) {
  return ActivityScopeLogic.stringListContains(list, value);
}

function uniqueStringList(list) {
  return ActivityScopeLogic.uniqueStringList(list);
}

function activitiesAreAll(activities) {
  return ActivityScopeLogic.activitiesAreAll(activities);
}

function normalizedActivityList(activities) {
  return ActivityScopeLogic.normalizedActivityList(activities);
}

function isInCurrentActivity(activities, currentActivity) {
  return ActivityScopeLogic.isInCurrentActivity(activities, currentActivity);
}

function taskActivitiesAfterToggle(activities, activityId) {
  const activity = String(activityId || "");
  if (!activity) {
    return Array.from(activities || []);
  }

  const activityList = Array.from(activities || []).map((entry) =>
    String(entry),
  );
  if (ActivityScopeLogic.activitiesAreAll(activityList)) {
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
