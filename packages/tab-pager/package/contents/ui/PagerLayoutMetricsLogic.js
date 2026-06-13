// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

const desktopGap = 1;
const fillMinimumExtent = 1;
const horizontalPanelCrossAxisInset = 0;
const unsetPreferredExtent = -1;
const verticalPanelCrossAxisInset = 0;

function calculateLayoutMetrics(
  verticalPanel,
  contentImplicitWidth,
  contentImplicitHeight,
) {
  const panelCrossAxisInset = verticalPanel
    ? verticalPanelCrossAxisInset
    : horizontalPanelCrossAxisInset;
  const boundedContentImplicitHeight = Math.max(
    contentImplicitHeight,
    fillMinimumExtent,
  );
  const boundedContentImplicitWidth = Math.max(
    contentImplicitWidth,
    fillMinimumExtent,
  );

  return {
    bottomInset: verticalPanel ? 0 : panelCrossAxisInset,
    boundedContentImplicitHeight,
    boundedContentImplicitWidth,
    desktopGap,
    fillHeight: !verticalPanel,
    fillMinimumExtent,
    fillWidth: verticalPanel,
    horizontalPanelCrossAxisInset,
    leftInset: verticalPanel ? panelCrossAxisInset : 0,
    maximumHeight: verticalPanel ? boundedContentImplicitHeight : Infinity,
    maximumWidth: verticalPanel ? Infinity : boundedContentImplicitWidth,
    minimumHeight: verticalPanel
      ? boundedContentImplicitHeight
      : fillMinimumExtent,
    minimumWidth: verticalPanel
      ? fillMinimumExtent
      : boundedContentImplicitWidth,
    panelCrossAxisInset,
    preferredHeight: verticalPanel
      ? boundedContentImplicitHeight
      : unsetPreferredExtent,
    preferredWidth: verticalPanel
      ? unsetPreferredExtent
      : boundedContentImplicitWidth,
    rightInset: verticalPanel ? panelCrossAxisInset : 0,
    topInset: verticalPanel ? 0 : panelCrossAxisInset,
    unsetPreferredExtent,
    useFillAreaConstraintHint: verticalPanel,
    verticalPanelCrossAxisInset,
  };
}
