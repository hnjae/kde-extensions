// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function taskExtent() {
  return 40;
}

export function titleVisibilityThreshold() {
  return 96;
}

export function taskTitleVisible(showTitle, slotWidth, threshold) {
  const width = Number(slotWidth || 0);
  return Boolean(showTitle) && (width <= 0 || width >= Number(threshold || 0));
}

export function taskImplicitWidth(slotWidth, naturalImplicitWidth) {
  const width = Number(slotWidth || 0);
  return width > 0 ? width : Number(naturalImplicitWidth || 0);
}

export function taskNaturalImplicitWidth(
  minimumWidth,
  maximumWidth,
  contentImplicitWidth,
  horizontalPadding,
) {
  const minimum = Number(minimumWidth || 0);
  const maximum = Number(maximumWidth || 0);
  const contentWidth =
    Number(contentImplicitWidth || 0) + Number(horizontalPadding || 0);
  return Math.max(minimum, Math.min(maximum, contentWidth));
}

export function maximumSlotWidth() {
  return 220;
}

export function normalNaturalWidthMinimum(showTitle) {
  return showTitle ? titleVisibilityThreshold() : 0;
}

export function attentionNaturalWidthMinimum() {
  return 112;
}

export function minimumReadableSlotWidth(extent, spacing) {
  return Number(extent || 0) + 2 * Number(spacing || 0);
}

export function adjustedFrameMargin(
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

export function nonNegativeNumber(value) {
  const number = Number(value || 0);
  return Number.isNaN(number) || number < 0 ? 0 : number;
}

export function taskSlotWidth(
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

export function iconExtentForTaskFrame(
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
