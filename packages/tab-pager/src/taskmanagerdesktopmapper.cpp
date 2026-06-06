// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopmapper.h"

#include <utility>

TabPagerDesktopSourceState taskManagerDesktopSourceStateFromRawState(
    const TaskManagerDesktopRawState &rawState) {
  QList<TabPagerDesktop> desktops;
  desktops.reserve(rawState.desktopIds.size());

  for (qsizetype index = 0; index < rawState.desktopIds.size(); ++index) {
    desktops.append(TabPagerDesktop{
        .id = TabPagerDesktopId::fromVariant(rawState.desktopIds.at(index)),
        .name = rawState.desktopNames.value(index),
    });
  }

  return TabPagerDesktopSourceState{
      .desktopSnapshot =
          TabPagerDesktopSnapshot{
              .desktops = std::move(desktops),
              .currentDesktop =
                  TabPagerDesktopId::fromVariant(rawState.currentDesktop),
          },
      .navigationWrappingAround = rawState.navigationWrappingAround,
  };
}
