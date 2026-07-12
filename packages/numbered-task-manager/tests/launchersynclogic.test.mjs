// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherSyncLogic.mjs", import.meta.url),
  [
    "createLauncherSyncState",
    "launcherSyncActionResult",
    "observeModelLauncherList",
    "retryPendingLauncherSync",
    "synchronizeLauncherList",
  ],
);

const plain = (value) => JSON.parse(JSON.stringify(value));

function createPorts(values = {}) {
  const calls = [];
  const state = {
    configLaunchers: Array.from(values.configLaunchers || []),
    modelLaunchers: Array.from(values.modelLaunchers || []),
    updating: false,
  };
  const attempts = {
    config: 0,
    model: 0,
  };

  return {
    attempts,
    calls,
    ports: {
      readConfigLaunchers: () => state.configLaunchers,
      readModelLaunchers: () => state.modelLaunchers,
      setUpdatingLauncherConfig: (updating) => {
        calls.push(["setUpdatingLauncherConfig", updating]);
        state.updating = updating;
      },
      writeConfigLaunchers: (launchers) => {
        attempts.config += 1;
        calls.push(["writeConfigLaunchers", Array.from(launchers || [])]);
        if (values.applyConfigBeforeThrow) {
          state.configLaunchers = Array.from(launchers || []);
        }
        if (
          values.throwConfigWrite === true ||
          attempts.config <= Number(values.throwConfigWrites || 0)
        ) {
          throw Object.assign(new Error("config denied"), {
            code: "E_CONFIG_DENIED",
          });
        }
        if (!values.ignoreConfigWrite) {
          state.configLaunchers = Array.from(launchers || []);
        }
      },
      writeModelLaunchers: (launchers) => {
        attempts.model += 1;
        calls.push(["writeModelLaunchers", Array.from(launchers || [])]);
        if (values.applyModelBeforeThrow) {
          state.modelLaunchers = Array.from(launchers || []);
        }
        if (
          values.throwModelWrite === true ||
          attempts.model <= Number(values.throwModelWrites || 0)
        ) {
          throw new Error("model denied");
        }
        if (!values.ignoreModelWrite) {
          state.modelLaunchers = Array.from(launchers || []);
        }
      },
    },
    state,
  };
}

assert.deepEqual(plain(logic.createLauncherSyncState()), {
  maxRetries: 1,
  pending: false,
  retries: 0,
  targetLaunchers: [],
});

{
  const { calls, ports, state } = createPorts({
    configLaunchers: ["a.desktop"],
    modelLaunchers: ["a.desktop"],
  });
  const output = logic.synchronizeLauncherList(
    ["", "a.desktop"],
    ports,
    logic.createLauncherSyncState(),
    "replaceLauncherList",
  );

  assert.equal(output.result.ok, true);
  assert.equal(output.result.code, "unchanged");
  assert.equal(output.retryRequested, false);
  assert.deepEqual(calls, []);
  assert.equal(state.updating, false);
}

{
  const { calls, ports, state } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
    throwConfigWrites: 1,
  });
  const initial = logic.synchronizeLauncherList(
    ["next.desktop"],
    ports,
    logic.createLauncherSyncState(),
    "replaceLauncherList",
  );

  assert.equal(initial.result.ok, false);
  assert.equal(initial.result.code, "reconciliation-pending");
  assert.deepEqual(initial.result.failedTargets, ["config"]);
  assert.deepEqual(initial.result.modelLaunchers, ["next.desktop"]);
  assert.deepEqual(initial.result.configLaunchers, ["old.desktop"]);
  assert.equal(initial.result.writeFailures[0].target, "config");
  assert.equal(initial.result.writeFailures[0].errorCode, "E_CONFIG_DENIED");
  assert.equal(initial.retryRequested, true);
  assert.deepEqual(plain(initial.state), {
    maxRetries: 1,
    pending: true,
    retries: 0,
    targetLaunchers: ["next.desktop"],
  });
  assert.equal(state.updating, false);

  const retried = logic.retryPendingLauncherSync(
    ports,
    initial.state,
    "replaceLauncherList",
  );
  assert.equal(retried.result.ok, true);
  assert.equal(retried.result.code, "converged");
  assert.equal(retried.retryRequested, false);
  assert.deepEqual(plain(retried.state), {
    maxRetries: 1,
    pending: false,
    retries: 0,
    targetLaunchers: [],
  });
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["next.desktop"]],
    ["writeModelLaunchers", ["next.desktop"]],
    ["setUpdatingLauncherConfig", false],
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["next.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
}

{
  const { ports, state } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
    throwConfigWrite: true,
  });
  const initial = logic.synchronizeLauncherList(
    ["next.desktop"],
    ports,
    logic.createLauncherSyncState(),
    "replaceLauncherList",
  );
  const expired = logic.retryPendingLauncherSync(
    ports,
    initial.state,
    "replaceLauncherList",
  );

  assert.equal(expired.result.ok, false);
  assert.equal(expired.result.code, "reconciliation-expired");
  assert.deepEqual(expired.result.failedTargets, ["config"]);
  assert.equal(expired.retryRequested, false);
  assert.equal(expired.state.pending, false);
  assert.equal(state.updating, false);
  assert.equal(
    logic.launcherSyncActionResult("replaceLauncherList", initial.result),
    null,
  );
  assert.equal(
    logic.launcherSyncActionResult("replaceLauncherList", expired.result).code,
    "reconciliation-expired",
  );
}

{
  const { ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
    throwModelWrites: 1,
  });
  const initial = logic.synchronizeLauncherList(
    ["next.desktop"],
    ports,
    logic.createLauncherSyncState(),
    "replaceLauncherList",
  );

  assert.deepEqual(initial.result.failedTargets, ["model"]);
  assert.deepEqual(initial.result.configLaunchers, ["next.desktop"]);
  assert.deepEqual(initial.result.modelLaunchers, ["old.desktop"]);
  assert.equal(
    logic.retryPendingLauncherSync(ports, initial.state).result.ok,
    true,
  );
}

{
  const { ports } = createPorts({
    applyConfigBeforeThrow: true,
    applyModelBeforeThrow: true,
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
    throwConfigWrite: true,
    throwModelWrite: true,
  });
  const output = logic.synchronizeLauncherList(
    ["next.desktop"],
    ports,
    logic.createLauncherSyncState(),
  );

  assert.equal(output.result.ok, true);
  assert.equal(output.result.code, "converged");
  assert.equal(output.result.writeFailures.length, 2);
  assert.equal(output.retryRequested, false);
}

{
  const { ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
    throwConfigWrite: true,
  });
  const first = logic.synchronizeLauncherList(
    ["first.desktop"],
    ports,
    logic.createLauncherSyncState(),
  );
  const latest = logic.synchronizeLauncherList(
    ["latest.desktop"],
    ports,
    first.state,
  );

  assert.equal(latest.state.pending, true);
  assert.equal(latest.state.retries, 0);
  assert.deepEqual(latest.state.targetLaunchers, ["latest.desktop"]);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["external.desktop"],
  });
  const idle = logic.observeModelLauncherList(
    ["external.desktop"],
    ports,
    logic.createLauncherSyncState(),
  );
  assert.equal(idle.handled, true);
  assert.equal(idle.result.ok, true);
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["external.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);

  const pendingState = logic.createLauncherSyncState({
    pending: true,
    retries: 0,
    targetLaunchers: ["latest.desktop"],
  });
  const pending = logic.observeModelLauncherList(
    ["external.desktop"],
    ports,
    pendingState,
  );
  assert.equal(pending.handled, true);
  assert.equal(pending.result, undefined);
  assert.deepEqual(pending.state.targetLaunchers, ["latest.desktop"]);
}
