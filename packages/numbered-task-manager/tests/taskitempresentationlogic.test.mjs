// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";

import { loadQmlJsModule } from "./qml-js-module.mjs";

const logic = await loadQmlJsModule(
  new URL(
    "../package/contents/ui/TaskItemPresentationLogic.mjs",
    import.meta.url,
  ),
  ["taskItemPresentation"],
);
const plain = (value) => JSON.parse(JSON.stringify(value));

function presentation({
  slotNumber = 1,
  frameExtent,
  contentStartMargin = 4,
  contentEndMargin = 4,
  minimumIconExtent = 16,
}) {
  return plain(
    logic.taskItemPresentation({
      contentEndMargin,
      contentStartMargin,
      frameExtent,
      minimumIconExtent,
      slotNumber,
    }),
  );
}

assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 32 }),
  {
    iconExtent: 32,
    numberMode: "prefix",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 32 }), {
  iconExtent: 24,
  numberMode: "prefix",
  slotLabel: "1",
});
assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 39 }),
  {
    iconExtent: 39,
    numberMode: "prefix",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 40 }), {
  iconExtent: 32,
  numberMode: "overlay",
  slotLabel: "1",
});
assert.deepEqual(
  presentation({ contentEndMargin: 0, contentStartMargin: 0, frameExtent: 40 }),
  {
    iconExtent: 40,
    numberMode: "overlay",
    slotLabel: "1",
  },
);
assert.deepEqual(presentation({ frameExtent: 40, slotNumber: 0 }), {
  iconExtent: 32,
  numberMode: "none",
  slotLabel: "",
});
assert.deepEqual(presentation({ frameExtent: 40, slotNumber: 10 }), {
  iconExtent: 32,
  numberMode: "none",
  slotLabel: "",
});
