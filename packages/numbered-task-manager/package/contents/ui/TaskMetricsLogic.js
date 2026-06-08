// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

function taskExtent() {
  return 40;
}

function titleVisibilityThreshold() {
  return 96;
}

function taskTitleVisible(showTitle, slotWidth, threshold) {
  const width = Number(slotWidth || 0);
  return Boolean(showTitle) && (width <= 0 || width >= Number(threshold || 0));
}

function taskImplicitWidth(slotWidth, naturalImplicitWidth) {
  const width = Number(slotWidth || 0);
  return width > 0 ? width : Number(naturalImplicitWidth || 0);
}

function maximumSlotWidth() {
  return 220;
}

function normalNaturalWidthMinimum(showTitle) {
  return showTitle ? titleVisibilityThreshold() : 0;
}

function attentionNaturalWidthMinimum() {
  return 112;
}

function minimumReadableSlotWidth(extent, spacing) {
  return Number(extent || 0) + 2 * Number(spacing || 0);
}

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

function nonNegativeNumber(value) {
  const number = Number(value || 0);
  return Number.isNaN(number) || number < 0 ? 0 : number;
}

function taskSlotWidth(
  availableExtent,
  itemCount,
  minimumExtent,
  maximumExtent,
) {
  const count = Math.floor(nonNegativeNumber(itemCount));
  if (count <= 0) {
    return 0;
  }

  const available = nonNegativeNumber(availableExtent);
  const minimum = nonNegativeNumber(minimumExtent);
  const maximum = Math.max(minimum, nonNegativeNumber(maximumExtent));
  const dividedExtent = Math.floor(available / count);
  return Math.max(minimum, Math.min(maximum, dividedExtent));
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
