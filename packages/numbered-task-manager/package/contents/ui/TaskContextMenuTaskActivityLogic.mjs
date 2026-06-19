// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ActivityScopeLogic from "./ActivityScopeLogic.mjs";
import { contextMenuTaskCommand } from "./TaskContextMenuCommandLogic.mjs";
import { taskActivitiesAfterToggle } from "./TaskActivityLogic.mjs";

function actionWithIcon(action, icon) {
  const actionState = Object.assign({}, action || {});
  Object.defineProperty(actionState, "icon", {
    configurable: true,
    enumerable: false,
    value: icon || "",
  });
  return actionState;
}

export function allTaskActivitiesCommand() {
  return contextMenuTaskCommand("requestActivities", []);
}

export function taskActivitiesActionState(taskState) {
  const state = taskState || {};
  const activityEntryCount = Number(state.activityEntryCount || 0);

  return {
    enabled: Boolean(state.hasWindowTask),
    visible: Boolean(state.isWindow && activityEntryCount > 1),
  };
}

export function taskActivitiesAction(taskState) {
  return actionWithIcon(
    Object.assign({}, taskActivitiesActionState(taskState), {
      text: "Activities",
    }),
    "activities",
  );
}

export function taskActivityMenuState(taskActivities, activityId) {
  const activities = Array.from(taskActivities || []);
  const allActivitiesChecked = ActivityScopeLogic.activitiesAreAll(activities);

  return {
    activityChecked:
      allActivitiesChecked ||
      ActivityScopeLogic.stringListContains(activities, activityId),
    allActivitiesChecked,
  };
}

export function taskActivityToggleCommand(taskActivities, activityId) {
  return contextMenuTaskCommand(
    "requestActivities",
    taskActivitiesAfterToggle(taskActivities, activityId),
  );
}

export function allTaskActivitiesAction(taskActivities) {
  const activityState = taskActivityMenuState(taskActivities, "");

  return {
    checked: activityState.allActivitiesChecked,
    command: allTaskActivitiesCommand(),
    text: "All Activities",
  };
}

export function taskActivityAction(taskActivities, activity) {
  const entry = activity || {};
  const activityState = taskActivityMenuState(taskActivities, entry.id);

  return {
    checked: activityState.activityChecked,
    command: taskActivityToggleCommand(taskActivities, entry.id),
    text: entry.name,
  };
}

export function taskActivityActionsSection(sectionState) {
  const state = sectionState || {};

  return {
    activityAction: (activity) =>
      taskActivityAction(state.activities, activity),
    allTaskActivities: allTaskActivitiesAction(state.activities),
    taskActivities: taskActivitiesAction({
      activityEntryCount: state.activityEntryCount,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
  };
}
