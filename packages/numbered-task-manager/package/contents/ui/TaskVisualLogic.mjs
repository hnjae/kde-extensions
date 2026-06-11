// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function baseFramePrefix(state) {
  const taskState = state || {};
  if (taskState.active) {
    return "focus";
  }

  if (
    taskState.attention ||
    taskState.demandingAttention ||
    taskState.dropHover
  ) {
    return "attention";
  }

  if (taskState.minimized || taskState.mutedLauncher) {
    return "minimized";
  }

  if (taskState.launcher) {
    return "";
  }

  return "normal";
}

export function locationPrefix(location, plasmaCoreTypes) {
  const types = plasmaCoreTypes || {};
  if (location === types.LeftEdge) {
    return "west";
  }

  if (location === types.TopEdge) {
    return "north";
  }

  if (location === types.RightEdge) {
    return "east";
  }

  return "south";
}

export function taskPrefix(prefix, location, plasmaCoreTypes) {
  return [`${locationPrefix(location, plasmaCoreTypes)}-${prefix}`, prefix];
}

export function hoveredFramePrefixes(prefix, location, plasmaCoreTypes) {
  const hoverPrefix = prefix || "launcher";
  const prefixes = taskPrefix(
    `${hoverPrefix}-hover`,
    location,
    plasmaCoreTypes,
  );

  if (prefix) {
    prefixes.push(...taskPrefix("hover", location, plasmaCoreTypes));
  }

  prefixes.push(...taskPrefix(prefix, location, plasmaCoreTypes));
  return prefixes;
}

export function iconActive(state) {
  const taskState = state || {};
  return Boolean(taskState.highlighted);
}

export function mutedLauncherIdle(state) {
  const taskState = state || {};
  return (
    Boolean(taskState.mutedLauncher) &&
    !(
      taskState.active ||
      taskState.attention ||
      taskState.demandingAttention ||
      taskState.dropHover ||
      taskState.hovered ||
      taskState.highlighted
    )
  );
}

export function frameOpacity(state) {
  return mutedLauncherIdle(state) ? 0.55 : 1;
}

export function contentOpacity(state) {
  return mutedLauncherIdle(state) ? 0.78 : 1;
}

export function framePrefixes(state, location, plasmaCoreTypes) {
  const prefix = baseFramePrefix(state);
  if (state?.hovered) {
    return hoveredFramePrefixes(prefix, location, plasmaCoreTypes);
  }

  return taskPrefix(prefix, location, plasmaCoreTypes);
}
