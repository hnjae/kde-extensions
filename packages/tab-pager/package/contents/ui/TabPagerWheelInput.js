// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function normalizeWheelDelta(angleDeltaX, angleDeltaY, inverted) {
  return (inverted ? -1 : 1) * (angleDeltaY || angleDeltaX);
}
