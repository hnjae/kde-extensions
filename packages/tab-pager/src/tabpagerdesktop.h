// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopid.h"

#include <QList>
#include <QString>

struct TabPagerDesktop {
  TabPagerDesktopId id;
  QString name;
};

struct TabPagerDesktopSnapshot {
  QList<TabPagerDesktop> desktops;
  TabPagerDesktopId currentDesktop;
};
