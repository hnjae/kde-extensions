// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function adjustedFrameMargin(
  frameExtent,
  occupiedMargins,
  margin,
  minimumIconExtent,
) {
  const extent = Number(frameExtent || 0);
  const totalMargins = Number(occupiedMargins || 0);
  const frameMargin = Number(margin || 0);
  const minimumExtent = Number(minimumIconExtent || 0);

  if (extent <= 0 || minimumExtent <= 0) {
    return frameMargin;
  }

  if (extent - totalMargins < minimumExtent) {
    return Math.ceil((frameMargin * (minimumExtent / extent)) / 2);
  }

  return frameMargin;
}

function iconExtentForTaskFrame(
  frameExtent,
  startMargin,
  endMargin,
  minimumIconExtent,
) {
  const extent = Number(frameExtent || 0);
  if (extent <= 0) {
    return 0;
  }

  const firstMargin = Number(startMargin || 0);
  const secondMargin = Number(endMargin || 0);
  const totalMargins = firstMargin + secondMargin;
  return Math.max(
    0,
    extent -
      adjustedFrameMargin(
        extent,
        totalMargins,
        firstMargin,
        minimumIconExtent,
      ) -
      adjustedFrameMargin(
        extent,
        totalMargins,
        secondMargin,
        minimumIconExtent,
      ),
  );
}
