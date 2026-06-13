// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";
import { contextMenuLauncherCommand } from "./TaskActionLogic.mjs";
import {
  launcherActivitiesAfterAllToggle,
  launcherActivitiesAfterToggle,
  launcherActivityUpdate,
  normalizedLauncherList,
} from "./LauncherListLogic.mjs";

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
}

export function replaceLauncherListCommand(launchers) {
  return contextMenuLauncherCommand("replaceLauncherList", launchers);
}

export function launcherActivitiesVisible(pinState, activityEntryCount) {
  const state = pinState || {};
  const count = Number(activityEntryCount || 0);
  return Boolean(
    state.canPin && state.isPinned && state.launcherUrl && count > 1,
  );
}

export function launcherActivitiesActionState(
  pinState,
  activityEntryCount,
  hasTaskModel,
) {
  const state = pinState || {};

  return {
    enabled: Boolean(hasTaskModel) && Boolean(state.canPin),
    visible: launcherActivitiesVisible(state, activityEntryCount),
  };
}

export function launcherActivitiesAction(
  pinState,
  activityEntryCount,
  hasTaskModel,
) {
  return actionWithIcon(
    Object.assign(
      {},
      launcherActivitiesActionState(pinState, activityEntryCount, hasTaskModel),
      {
        text: "Launcher Activities",
      },
    ),
    "window-pin",
  );
}

export function launcherActivityListSnapshot(launcherActivities) {
  return ActivityScopeLogic.normalizedActivityList(launcherActivities);
}

export function launcherActivityMenuState(launcherActivities, activityId) {
  const activities = launcherActivityListSnapshot(launcherActivities);
  const allActivitiesChecked = ActivityScopeLogic.activitiesAreAll(activities);

  return {
    activities,
    activityChecked:
      allActivitiesChecked ||
      ActivityScopeLogic.stringListContains(activities, activityId),
    allActivitiesChecked,
  };
}

export function launcherActivityUpdateCommand(
  launcherList,
  position,
  activities,
) {
  const update = launcherActivityUpdate(launcherList, position, activities);
  return Object.assign({}, update, {
    command:
      update.ok && update.changed
        ? replaceLauncherListCommand(update.launchers)
        : null,
  });
}

export function launcherAllActivitiesUpdateCommand(
  launcherList,
  position,
  launcherActivities,
  currentActivity,
) {
  const nextActivities = launcherActivitiesAfterAllToggle(
    launcherActivities,
    currentActivity,
  );
  if (!nextActivities) {
    return {
      activities: launcherActivityListSnapshot(launcherActivities),
      changed: false,
      command: null,
      launchers: normalizedLauncherList(launcherList),
      ok: false,
      reason: "missing-current-activity",
    };
  }

  return launcherActivityUpdateCommand(launcherList, position, nextActivities);
}

export function launcherActivityToggleUpdateCommand(
  launcherList,
  position,
  launcherActivities,
  activityId,
  currentActivity,
) {
  return launcherActivityUpdateCommand(
    launcherList,
    position,
    launcherActivitiesAfterToggle(
      launcherActivities,
      activityId,
      currentActivity,
    ),
  );
}

export function launcherAllActivitiesAction(
  launcherList,
  position,
  launcherActivities,
  currentActivity,
) {
  const activityState = launcherActivityMenuState(launcherActivities, "");

  return {
    checked: activityState.allActivitiesChecked,
    text: "All Activities",
    update: launcherAllActivitiesUpdateCommand(
      launcherList,
      position,
      launcherActivities,
      currentActivity,
    ),
  };
}

export function launcherActivityAction(
  launcherList,
  position,
  launcherActivities,
  activity,
  currentActivity,
) {
  const entry = activity || {};
  const activityState = launcherActivityMenuState(launcherActivities, entry.id);

  return {
    checked: activityState.activityChecked,
    text: entry.name,
    update: launcherActivityToggleUpdateCommand(
      launcherList,
      position,
      launcherActivities,
      entry.id,
      currentActivity,
    ),
  };
}

export function launcherActivityActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    activityAction: (activity) =>
      launcherActivityAction(
        state.launcherList,
        state.launcherPosition,
        state.launcherActivities,
        activity,
        state.currentActivity,
      ),
    allLauncherActivities: launcherAllActivitiesAction(
      state.launcherList,
      state.launcherPosition,
      state.launcherActivities,
      state.currentActivity,
    ),
    launcherActivities: launcherActivitiesAction(
      state.pinState,
      state.activityEntryCount,
      state.hasTaskModel,
    ),
  };
}
