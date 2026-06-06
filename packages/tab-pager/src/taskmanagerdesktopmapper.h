// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <QStringList>
#include <QVariant>
#include <QVariantList>

struct TaskManagerDesktopRawState {
  QVariantList desktopIds;
  QStringList desktopNames;
  QVariant currentDesktop;
  bool navigationWrappingAround = false;
};

[[nodiscard]] TabPagerDesktopSourceState
taskManagerDesktopSourceStateFromRawState(
    const TaskManagerDesktopRawState &rawState);
