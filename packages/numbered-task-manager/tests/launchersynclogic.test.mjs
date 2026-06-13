// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL("../package/contents/ui/LauncherSyncLogic.mjs", import.meta.url),
  [
    "applyLauncherList",
    "createLauncherSyncState",
    "persistLaunchers",
    "reconcileLauncherListChange",
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

  return {
    calls,
    ports: {
      readConfigLaunchers: () => state.configLaunchers,
      readModelLaunchers: () => state.modelLaunchers,
      setUpdatingLauncherConfig: (updating) => {
        calls.push(["setUpdatingLauncherConfig", updating]);
        state.updating = updating;
      },
      writeConfigLaunchers: (launchers) => {
        calls.push(["writeConfigLaunchers", Array.from(launchers || [])]);
        if (values.throwConfigWrite) {
          throw new Error("config denied");
        }
        if (!values.ignoreConfigWrite) {
          state.configLaunchers = Array.from(launchers || []);
        }
      },
      writeModelLaunchers: (launchers) => {
        calls.push(["writeModelLaunchers", Array.from(launchers || [])]);
        if (values.throwModelWrite) {
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
  reconciliation: {
    attempts: 0,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  },
});

{
  const { calls, ports, state } = createPorts({
    configLaunchers: ["a.desktop"],
    modelLaunchers: ["a.desktop"],
  });
  const output = logic.persistLaunchers(["a.desktop"], ports);

  assert.deepEqual(plain(output), {
    result: {
      changed: false,
      code: "unchanged",
      configConverged: true,
      configLaunchers: ["a.desktop"],
      failedTargets: [],
      launchers: ["a.desktop"],
      ok: true,
    },
    state: {
      reconciliation: {
        attempts: 0,
        launchers: [],
        maxAttempts: 1,
        pending: false,
      },
    },
  });
  assert.deepEqual(calls, []);
  assert.equal(state.updating, false);
}

{
  const { calls, ports, state } = createPorts({
    configLaunchers: ["a.desktop"],
  });
  const output = logic.persistLaunchers(["b.desktop"], ports);

  assert.equal(output.result.ok, true);
  assert.equal(output.result.code, "converged");
  assert.deepEqual(output.result.configLaunchers, ["b.desktop"]);
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["b.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
  assert.equal(state.updating, false);
}

{
  const { calls, ports, state } = createPorts({
    configLaunchers: ["a.desktop"],
    throwConfigWrite: true,
  });
  const output = logic.persistLaunchers(["b.desktop"], ports);

  assert.deepEqual(plain(output.result), {
    changed: false,
    code: "write-failed",
    error: "config denied",
    ok: false,
  });
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["b.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
  assert.equal(state.updating, false);
}

{
  const { ports } = createPorts({
    configLaunchers: ["a.desktop"],
    ignoreConfigWrite: true,
  });
  const output = logic.persistLaunchers(["b.desktop"], ports);

  assert.equal(output.result.ok, false);
  assert.equal(output.result.code, "write-mismatch");
  assert.deepEqual(output.result.failedTargets, ["config"]);
  assert.deepEqual(output.state.reconciliation.launchers, ["b.desktop"]);
  assert.equal(output.state.reconciliation.pending, true);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["a.desktop"],
  });
  const output = logic.applyLauncherList(["a.desktop"], ports);

  assert.equal(output.changed, true);
  assert.equal(output.result.ok, true);
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeConfigLaunchers", ["a.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["a.desktop"],
    modelLaunchers: ["old.desktop"],
  });
  const output = logic.applyLauncherList(["a.desktop"], ports);

  assert.equal(output.changed, true);
  assert.equal(output.result.ok, true);
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeModelLaunchers", ["a.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["old-config.desktop"],
    modelLaunchers: ["old-model.desktop"],
  });
  const output = logic.applyLauncherList(["next.desktop"], ports);

  assert.equal(output.changed, true);
  assert.equal(output.result.ok, true);
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeModelLaunchers", ["next.desktop"]],
    ["writeConfigLaunchers", ["next.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
  });
  const pending = logic.createLauncherSyncState({
    reconciliation: {
      attempts: 0,
      launchers: ["next.desktop"],
      maxAttempts: 1,
      pending: true,
    },
  });
  const output = logic.reconcileLauncherListChange(
    ["old.desktop"],
    ports,
    pending,
  );

  assert.equal(output.handled, true);
  assert.equal(output.action, "retry");
  assert.equal(output.result.ok, true);
  assert.deepEqual(output.state.reconciliation, {
    attempts: 1,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  });
  assert.deepEqual(calls, [
    ["setUpdatingLauncherConfig", true],
    ["writeModelLaunchers", ["next.desktop"]],
    ["writeConfigLaunchers", ["next.desktop"]],
    ["setUpdatingLauncherConfig", false],
  ]);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["next.desktop"],
    modelLaunchers: ["next.desktop"],
  });
  const pending = logic.createLauncherSyncState({
    reconciliation: {
      attempts: 0,
      launchers: ["next.desktop"],
      maxAttempts: 1,
      pending: true,
    },
  });
  const output = logic.reconcileLauncherListChange(
    ["next.desktop"],
    ports,
    pending,
  );

  assert.equal(output.handled, true);
  assert.equal(output.action, "clear");
  assert.deepEqual(output.state.reconciliation, {
    attempts: 0,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  });
  assert.deepEqual(calls, []);
}

{
  const { calls, ports } = createPorts({
    configLaunchers: ["old.desktop"],
    modelLaunchers: ["old.desktop"],
  });
  const pending = logic.createLauncherSyncState({
    reconciliation: {
      attempts: 1,
      launchers: ["next.desktop"],
      maxAttempts: 1,
      pending: true,
    },
  });
  const output = logic.reconcileLauncherListChange(
    ["old.desktop"],
    ports,
    pending,
  );

  assert.equal(output.handled, true);
  assert.equal(output.action, "expired");
  assert.equal(output.result.ok, false);
  assert.equal(output.result.code, "reconciliation-expired");
  assert.deepEqual(output.state.reconciliation, {
    attempts: 1,
    launchers: [],
    maxAttempts: 1,
    pending: false,
  });
  assert.deepEqual(calls, []);
}
