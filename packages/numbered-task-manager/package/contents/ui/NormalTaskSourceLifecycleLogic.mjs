// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export const emitDiagnosticsCommand = "emitDiagnostics";
export const publishTaskCommand = "publishTask";
export const removeTaskCommand = "removeTask";

export function createNormalTaskSourceRowState(values) {
  const state = values || {};
  return {
    publishedKey: String(state.publishedKey || ""),
  };
}

export function normalTaskSourceSnapshot(values) {
  const snapshot = values || {};
  return {
    qualifies: Boolean(snapshot.qualifies),
    task: Object.assign({}, snapshot.task || {}),
  };
}

export function normalTaskSourcePublishCommand(key, snapshot) {
  const taskSnapshot = normalTaskSourceSnapshot(snapshot);
  const task = Object.assign({}, taskSnapshot.task, {
    entryKey: key,
  });

  return {
    key,
    qualifies: taskSnapshot.qualifies,
    task,
    type: publishTaskCommand,
  };
}

export function normalTaskSourcePublishCommands(key, snapshot) {
  if (!key) {
    return [];
  }

  return [
    {
      type: emitDiagnosticsCommand,
    },
    normalTaskSourcePublishCommand(key, snapshot),
  ];
}

export function normalTaskSourceRowAppeared(_state, key, snapshot) {
  const publishedKey = String(key || "");
  return {
    commands: normalTaskSourcePublishCommands(publishedKey, snapshot),
    state: createNormalTaskSourceRowState({
      publishedKey,
    }),
  };
}

export function normalTaskSourceRowChanged(state, snapshot) {
  const current = createNormalTaskSourceRowState(state);
  return {
    commands: normalTaskSourcePublishCommands(current.publishedKey, snapshot),
    state: current,
  };
}

export function normalTaskSourceRowRemoved(state) {
  const current = createNormalTaskSourceRowState(state);
  return {
    commands: current.publishedKey
      ? [
          {
            key: current.publishedKey,
            type: removeTaskCommand,
          },
        ]
      : [],
    state: createNormalTaskSourceRowState(),
  };
}
