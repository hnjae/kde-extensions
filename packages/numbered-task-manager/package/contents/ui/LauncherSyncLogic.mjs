// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  createLauncherReconciliationState,
  launcherConfigConvergence,
  launcherConfigUpdate,
  launcherModelConvergence,
  launcherModelUpdate,
  launcherReconciliationAfterResult,
  launcherReconciliationDecision,
  launcherSyncResultWithRetryClassification,
  launcherWriteErrorMessage,
} from "./LauncherListLogic.mjs";

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
