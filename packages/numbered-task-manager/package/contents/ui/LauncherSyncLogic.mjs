// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  launcherListsEqual,
  normalizedLauncherList,
} from "./LauncherListLogic.mjs";

export function launcherConfigUpdate(currentLaunchers, nextLaunchers) {
  const normalized = normalizedLauncherList(nextLaunchers);
  return {
    changed: !launcherListsEqual(normalized, currentLaunchers),
    launchers: normalized,
  };
}

export function launcherModelUpdate(
  currentModelLaunchers,
  currentConfigLaunchers,
  nextLaunchers,
) {
  const normalized = normalizedLauncherList(nextLaunchers);
  const modelChanged = !launcherListsEqual(normalized, currentModelLaunchers);
  const configChanged = !launcherListsEqual(normalized, currentConfigLaunchers);

  return {
    changed: modelChanged || configChanged,
    configChanged,
    launchers: normalized,
    modelChanged,
  };
}

export function launcherSyncCode(changed, failedTargets) {
  if (failedTargets.length > 0) {
    return "write-mismatch";
  }

  return changed ? "converged" : "unchanged";
}

export function launcherSyncRetryClassification(result) {
  const syncResult = result || {};
  if (syncResult.ok) {
    return "none";
  }

  if (syncResult.retryClassification) {
    return String(syncResult.retryClassification);
  }

  switch (syncResult.code) {
    case "write-mismatch":
      return "retry-after-change";
    case "reconciliation-expired":
    case "write-failed":
      return "fatal";
    default:
      return "fatal";
  }
}

export function launcherSyncResultWithRetryClassification(result) {
  const syncResult = result || {};
  if (syncResult.ok) {
    return syncResult;
  }

  return Object.assign({}, syncResult, {
    retryClassification: launcherSyncRetryClassification(syncResult),
  });
}

export function launcherConfigConvergence(update, observedConfigLaunchers) {
  const launcherUpdate = update || {};
  const launchers = normalizedLauncherList(launcherUpdate.launchers);
  const configLaunchers = normalizedLauncherList(observedConfigLaunchers);
  const configConverged = launcherListsEqual(launchers, configLaunchers);
  const failedTargets = configConverged ? [] : ["config"];

  return launcherSyncResultWithRetryClassification({
    changed: Boolean(launcherUpdate.changed),
    code: launcherSyncCode(Boolean(launcherUpdate.changed), failedTargets),
    configConverged,
    configLaunchers,
    failedTargets,
    launchers,
    ok: failedTargets.length === 0,
  });
}

export function launcherModelConvergence(
  update,
  observedModelLaunchers,
  observedConfigLaunchers,
) {
  const launcherUpdate = update || {};
  const launchers = normalizedLauncherList(launcherUpdate.launchers);
  const modelLaunchers = normalizedLauncherList(observedModelLaunchers);
  const configLaunchers = normalizedLauncherList(observedConfigLaunchers);
  const modelConverged = launcherListsEqual(launchers, modelLaunchers);
  const configConverged = launcherListsEqual(launchers, configLaunchers);
  const failedTargets = [];
  if (!modelConverged) {
    failedTargets.push("model");
  }
  if (!configConverged) {
    failedTargets.push("config");
  }

  return launcherSyncResultWithRetryClassification({
    changed: Boolean(launcherUpdate.changed),
    code: launcherSyncCode(Boolean(launcherUpdate.changed), failedTargets),
    configConverged,
    configLaunchers,
    failedTargets,
    launchers,
    modelConverged,
    modelLaunchers,
    ok: failedTargets.length === 0,
  });
}

export function launcherWriteErrorMessage(error) {
  if (error?.message) {
    return String(error.message);
  }

  return String(error);
}

export function runLauncherListUpdateTransaction(state, action) {
  const updateState = state || {};
  updateState.updatingLauncherConfig = true;
  try {
    return action();
  } catch (error) {
    return launcherSyncResultWithRetryClassification({
      changed: false,
      code: "write-failed",
      error: launcherWriteErrorMessage(error),
      ok: false,
    });
  } finally {
    updateState.updatingLauncherConfig = false;
  }
}

export function createLauncherReconciliationState(values) {
  const state = values || {};
  return {
    attempts: Math.max(0, Number(state.attempts || 0)),
    launchers: normalizedLauncherList(state.launchers),
    maxAttempts: Math.max(0, Number(state.maxAttempts ?? 1)),
    pending: Boolean(state.pending),
  };
}

export function clearLauncherReconciliationState(state) {
  const current = createLauncherReconciliationState(state);
  return {
    attempts: current.attempts,
    launchers: [],
    maxAttempts: current.maxAttempts,
    pending: false,
  };
}

export function launcherReconciliationAfterResult(state, result) {
  const current = createLauncherReconciliationState(state);
  const syncResult = result || {};
  if (
    syncResult.ok ||
    launcherSyncRetryClassification(syncResult) !== "retry-after-change"
  ) {
    return clearLauncherReconciliationState(current);
  }

  if (current.pending && current.attempts >= current.maxAttempts) {
    return clearLauncherReconciliationState(current);
  }

  return {
    attempts: current.pending ? current.attempts : 0,
    launchers: normalizedLauncherList(syncResult.launchers),
    maxAttempts: current.maxAttempts,
    pending: true,
  };
}

export function launcherReconciliationDecision(
  state,
  observedModelLaunchers,
  observedConfigLaunchers,
) {
  const current = createLauncherReconciliationState(state);
  if (!current.pending) {
    return {
      action: "none",
      launchers: [],
      state: current,
    };
  }

  const modelConverged = launcherListsEqual(
    current.launchers,
    observedModelLaunchers,
  );
  const configConverged = launcherListsEqual(
    current.launchers,
    observedConfigLaunchers,
  );
  if (modelConverged && configConverged) {
    return {
      action: "clear",
      launchers: [],
      state: clearLauncherReconciliationState(current),
    };
  }

  if (current.attempts >= current.maxAttempts) {
    return {
      action: "expired",
      launchers: current.launchers,
      state: clearLauncherReconciliationState(current),
    };
  }

  return {
    action: "retry",
    launchers: current.launchers,
    state: {
      attempts: current.attempts + 1,
      launchers: current.launchers,
      maxAttempts: current.maxAttempts,
      pending: true,
    },
  };
}

export function createLauncherSyncState(values) {
  const state = values || {};
  return {
    reconciliation: createLauncherReconciliationState(state.reconciliation),
  };
}

function readConfigLaunchers(ports) {
  return typeof ports?.readConfigLaunchers === "function"
    ? ports.readConfigLaunchers()
    : [];
}

function readModelLaunchers(ports) {
  return typeof ports?.readModelLaunchers === "function"
    ? ports.readModelLaunchers()
    : [];
}

function setUpdatingLauncherConfig(ports, updating) {
  if (typeof ports?.setUpdatingLauncherConfig === "function") {
    ports.setUpdatingLauncherConfig(Boolean(updating));
  }
}

function runLauncherSyncTransaction(ports, action) {
  setUpdatingLauncherConfig(ports, true);
  try {
    return action();
  } catch (error) {
    return launcherSyncResultWithRetryClassification({
      changed: false,
      code: "write-failed",
      error: launcherWriteErrorMessage(error),
      ok: false,
    });
  } finally {
    setUpdatingLauncherConfig(ports, false);
  }
}

export function launcherSyncStateAfterResult(state, result) {
  const current = createLauncherSyncState(state);
  return {
    reconciliation: launcherReconciliationAfterResult(
      current.reconciliation,
      result,
    ),
  };
}

export function persistLaunchers(launchers, ports, state) {
  const current = createLauncherSyncState(state);
  const update = launcherConfigUpdate(readConfigLaunchers(ports), launchers);
  if (!update.changed) {
    return {
      result: launcherConfigConvergence(update, readConfigLaunchers(ports)),
      state: current,
    };
  }

  const result = runLauncherSyncTransaction(ports, () => {
    ports.writeConfigLaunchers(update.launchers);
    return launcherConfigConvergence(update, readConfigLaunchers(ports));
  });

  return {
    result,
    state: launcherSyncStateAfterResult(current, result),
  };
}

export function applyLauncherList(launchers, ports, state) {
  const current = createLauncherSyncState(state);
  const update = launcherModelUpdate(
    readModelLaunchers(ports),
    readConfigLaunchers(ports),
    launchers,
  );
  if (!update.changed) {
    return {
      changed: false,
      result: launcherModelConvergence(
        update,
        readModelLaunchers(ports),
        readConfigLaunchers(ports),
      ),
      state: current,
    };
  }

  const result = runLauncherSyncTransaction(ports, () => {
    if (update.modelChanged) {
      ports.writeModelLaunchers(update.launchers);
    }
    if (update.configChanged) {
      ports.writeConfigLaunchers(update.launchers);
    }
    return launcherModelConvergence(
      update,
      readModelLaunchers(ports),
      readConfigLaunchers(ports),
    );
  });

  return {
    changed: Boolean(result?.changed),
    result,
    state: launcherSyncStateAfterResult(current, result),
  };
}

export function reconcileLauncherListChange(modelLaunchers, ports, state) {
  const current = createLauncherSyncState(state);
  const decision = launcherReconciliationDecision(
    current.reconciliation,
    modelLaunchers,
    readConfigLaunchers(ports),
  );
  const nextState = {
    reconciliation: decision.state,
  };

  if (decision.action === "none") {
    return {
      action: "none",
      handled: false,
      state: nextState,
    };
  }

  if (decision.action === "retry") {
    const output = applyLauncherList(decision.launchers, ports, nextState);
    return {
      action: "retry",
      handled: true,
      result: output.result,
      state: output.state,
    };
  }

  if (decision.action === "expired") {
    const expiredResult = launcherSyncResultWithRetryClassification(
      Object.assign(
        {},
        launcherModelConvergence(
          {
            changed: true,
            launchers: decision.launchers || [],
          },
          modelLaunchers,
          readConfigLaunchers(ports),
        ),
        {
          code: "reconciliation-expired",
          ok: false,
          retryClassification: "fatal",
        },
      ),
    );
    return {
      action: "expired",
      handled: true,
      result: expiredResult,
      state: nextState,
    };
  }

  return {
    action: decision.action || "clear",
    handled: true,
    state: nextState,
  };
}
