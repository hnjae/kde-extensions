// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { iconExtentForTaskFrame } from "./TaskMetricsLogic.mjs";
import { validSlotNumber } from "./TaskNumberingLogic.mjs";

export function taskItemPresentation(input) {
  const values = input || {};
  const frameExtent = Number(values.frameExtent || 0);
  const minimumIconExtent = Number(values.minimumIconExtent || 0);
  const slotNumber = validSlotNumber(values.slotNumber);
  const iconExtent = iconExtentForTaskFrame(
    frameExtent,
    values.contentStartMargin,
    values.contentEndMargin,
    minimumIconExtent,
  );

  if (slotNumber === 0) {
    return {
      iconExtent,
      numberMode: "none",
      slotLabel: "",
    };
  }

  if (iconExtent >= 24 && frameExtent >= 24 + minimumIconExtent) {
    return {
      iconExtent,
      numberMode: "overlay",
      slotLabel: slotNumber.toString(),
    };
  }

  return {
    iconExtent,
    numberMode: "prefix",
    slotLabel: slotNumber.toString(),
  };
}
