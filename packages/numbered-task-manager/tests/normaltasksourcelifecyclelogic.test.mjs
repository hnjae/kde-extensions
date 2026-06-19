// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/NormalTaskSourceLifecycleLogic.mjs",
    import.meta.url,
  ),
  [
    "createNormalTaskSourceRowState",
    "normalTaskSourceRowAppeared",
    "normalTaskSourceRowChanged",
    "normalTaskSourceRowRemoved",
  ],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

const task = {
  entryKey: "",
  launcherUrl: "app.desktop",
  sourceIndex: 4,
  title: "App",
};
const changedTask = Object.assign({}, task, {
  title: "App Updated",
});

assert.deepEqual(plain(logic.createNormalTaskSourceRowState()), {
  publishedKey: "",
});

assert.deepEqual(
  plain(
    logic.normalTaskSourceRowChanged(logic.createNormalTaskSourceRowState(), {
      qualifies: true,
      task,
    }),
  ),
  {
    commands: [],
    state: {
      publishedKey: "",
    },
  },
);

const appeared = logic.normalTaskSourceRowAppeared(
  logic.createNormalTaskSourceRowState(),
  "normal:1",
  {
    qualifies: true,
    task,
  },
);
assert.deepEqual(plain(appeared), {
  commands: [
    {
      type: "emitDiagnostics",
    },
    {
      key: "normal:1",
      qualifies: true,
      task: {
        entryKey: "normal:1",
        launcherUrl: "app.desktop",
        sourceIndex: 4,
        title: "App",
      },
      type: "publishTask",
    },
  ],
  state: {
    publishedKey: "normal:1",
  },
});

assert.deepEqual(
  plain(
    logic.normalTaskSourceRowChanged(appeared.state, {
      qualifies: false,
      task: changedTask,
    }),
  ),
  {
    commands: [
      {
        type: "emitDiagnostics",
      },
      {
        key: "normal:1",
        qualifies: false,
        task: {
          entryKey: "normal:1",
          launcherUrl: "app.desktop",
          sourceIndex: 4,
          title: "App Updated",
        },
        type: "publishTask",
      },
    ],
    state: {
      publishedKey: "normal:1",
    },
  },
);

assert.deepEqual(plain(logic.normalTaskSourceRowRemoved(appeared.state)), {
  commands: [
    {
      key: "normal:1",
      type: "removeTask",
    },
  ],
  state: {
    publishedKey: "",
  },
});

assert.deepEqual(
  plain(
    logic.normalTaskSourceRowRemoved(logic.createNormalTaskSourceRowState()),
  ),
  {
    commands: [],
    state: {
      publishedKey: "",
    },
  },
);
