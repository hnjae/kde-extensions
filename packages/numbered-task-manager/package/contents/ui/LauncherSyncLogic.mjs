// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { errorContext } from "./ErrorContextLogic.mjs";
import {
  launcherListsEqual,
  normalizedLauncherList,
} from "./LauncherListLogic.mjs";

export function createLauncherSyncState(values) {
  const state = values || {};
  return {
    maxRetries: Math.max(0, Number(state.maxRetries ?? 1)),
    pending: Boolean(state.pending),
    retries: Math.max(0, Number(state.retries || 0)),
    targetLaunchers: normalizedLauncherList(state.targetLaunchers),
  };
}

function clearedLauncherSyncState(state) {
  const current = createLauncherSyncState(state);
  return {
    maxRetries: current.maxRetries,
    pending: false,
    retries: 0,
    targetLaunchers: [],
  };
}

function pendingLauncherSyncState(state, targetLaunchers, retries) {
  const current = createLauncherSyncState(state);
  return {
    maxRetries: current.maxRetries,
    pending: true,
    retries: Math.max(0, Number(retries || 0)),
    targetLaunchers: normalizedLauncherList(targetLaunchers),
  };
}

function readConfigLaunchers(ports) {
  return normalizedLauncherList(
    typeof ports?.readConfigLaunchers === "function"
      ? ports.readConfigLaunchers()
      : [],
  );
}

function readModelLaunchers(ports) {
  return normalizedLauncherList(
    typeof ports?.readModelLaunchers === "function"
      ? ports.readModelLaunchers()
      : [],
  );
}

function setUpdatingLauncherConfig(ports, updating) {
  if (typeof ports?.setUpdatingLauncherConfig === "function") {
    ports.setUpdatingLauncherConfig(Boolean(updating));
  }
}

function writeFailure(target, error) {
  return Object.assign({ target }, errorContext(error));
}

function convergenceResult(
  targetLaunchers,
  modelLaunchers,
  configLaunchers,
  writeFailures,
  changed,
  code,
) {
  const failedTargets = [];
  if (!launcherListsEqual(targetLaunchers, configLaunchers)) {
    failedTargets.push("config");
  }
  if (!launcherListsEqual(targetLaunchers, modelLaunchers)) {
    failedTargets.push("model");
  }

  return {
    changed: Boolean(changed),
    code,
    configLaunchers,
    failedTargets,
    modelLaunchers,
    ok: failedTargets.length === 0,
    targetLaunchers,
    writeFailures: Array.from(writeFailures || []),
  };
}

function attemptLauncherListConvergence(targetLaunchers, ports, state, retry) {
  const current = createLauncherSyncState(state);
  const target = normalizedLauncherList(targetLaunchers);
  const initialConfigLaunchers = readConfigLaunchers(ports);
  const initialModelLaunchers = readModelLaunchers(ports);
  const configChanged = !launcherListsEqual(target, initialConfigLaunchers);
  const modelChanged = !launcherListsEqual(target, initialModelLaunchers);
  const changed = configChanged || modelChanged;

  if (!changed) {
    return {
      result: convergenceResult(
        target,
        initialModelLaunchers,
        initialConfigLaunchers,
        [],
        false,
        "unchanged",
      ),
      retryRequested: false,
      state: clearedLauncherSyncState(current),
    };
  }

  const writeFailures = [];
  setUpdatingLauncherConfig(ports, true);
  try {
    if (configChanged) {
      try {
        ports.writeConfigLaunchers(target);
      } catch (error) {
        writeFailures.push(writeFailure("config", error));
      }
    }
    if (modelChanged) {
      try {
        ports.writeModelLaunchers(target);
      } catch (error) {
        writeFailures.push(writeFailure("model", error));
      }
    }
  } finally {
    setUpdatingLauncherConfig(ports, false);
  }

  const observedConfigLaunchers = readConfigLaunchers(ports);
  const observedModelLaunchers = readModelLaunchers(ports);
  const observed = convergenceResult(
    target,
    observedModelLaunchers,
    observedConfigLaunchers,
    writeFailures,
    true,
    "converged",
  );
  if (observed.ok) {
    return {
      result: observed,
      retryRequested: false,
      state: clearedLauncherSyncState(current),
    };
  }

  const retries = retry ? current.retries : 0;
  const expired = retries >= current.maxRetries;
  const result = Object.assign({}, observed, {
    code: expired ? "reconciliation-expired" : "reconciliation-pending",
    ok: false,
  });
  return {
    result,
    retryRequested: !expired,
    state: expired
      ? clearedLauncherSyncState(current)
      : pendingLauncherSyncState(current, target, retries),
  };
}

export function synchronizeLauncherList(targetLaunchers, ports, state, cause) {
  const target = normalizedLauncherList(targetLaunchers);
  const current = createLauncherSyncState(state);
  const nextState = launcherListsEqual(target, current.targetLaunchers)
    ? current
    : pendingLauncherSyncState(current, target, 0);
  const output = attemptLauncherListConvergence(
    target,
    ports,
    nextState,
    false,
  );
  output.result.cause = String(cause || "synchronizeLauncherList");
  return output;
}

export function retryPendingLauncherSync(ports, state, cause) {
  const current = createLauncherSyncState(state);
  if (!current.pending) {
    return {
      retryRequested: false,
      state: current,
    };
  }

  const retryState = pendingLauncherSyncState(
    current,
    current.targetLaunchers,
    current.retries + 1,
  );
  const output = attemptLauncherListConvergence(
    retryState.targetLaunchers,
    ports,
    retryState,
    true,
  );
  output.result.cause = String(cause || "retryLauncherList");
  return output;
}

export function observeModelLauncherList(modelLaunchers, ports, state) {
  const current = createLauncherSyncState(state);
  if (current.pending) {
    return {
      handled: true,
      retryRequested: true,
      state: current,
    };
  }

  return Object.assign(
    {
      handled: true,
    },
    synchronizeLauncherList(
      modelLaunchers,
      ports,
      current,
      "observeModelLauncherList",
    ),
  );
}

export function launcherSyncActionResult(action, result) {
  const syncResult = result || {};
  if (
    !syncResult.code ||
    syncResult.ok ||
    syncResult.code === "reconciliation-pending"
  ) {
    return null;
  }

  return actionResult("syncLaunchers", syncResult.code, false, true, {
    cause: String(syncResult.cause || ""),
    configLaunchers: normalizedLauncherList(syncResult.configLaunchers),
    failedTargets: Array.from(syncResult.failedTargets || []),
    launcherSyncAction: String(action || ""),
    modelLaunchers: normalizedLauncherList(syncResult.modelLaunchers),
    targetLaunchers: normalizedLauncherList(syncResult.targetLaunchers),
    writeFailures: Array.from(syncResult.writeFailures || []),
  });
}
