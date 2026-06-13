// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpageractivationresult.h"

QString tabPagerActivationResultName(TabPagerActivationResult result) {
  switch (result) {
  case TabPagerActivationResult::ActivationRequested:
    return QStringLiteral("ActivationRequested");
  case TabPagerActivationResult::InvalidIndex:
    return QStringLiteral("InvalidIndex");
  case TabPagerActivationResult::InvalidDesktopId:
    return QStringLiteral("InvalidDesktopId");
  case TabPagerActivationResult::NoCurrentDesktop:
    return QStringLiteral("NoCurrentDesktop");
  case TabPagerActivationResult::StoppedAtEdge:
    return QStringLiteral("StoppedAtEdge");
  case TabPagerActivationResult::NoWheelStep:
    return QStringLiteral("NoWheelStep");
  }

  return QStringLiteral("NoCurrentDesktop");
}
