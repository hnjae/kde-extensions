// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopsource.h"

bool operator==(const TabPagerDesktop &left, const TabPagerDesktop &right) {
  return left.id == right.id && left.name == right.name;
}

TabPagerDesktopSource::TabPagerDesktopSource(QObject *parent)
    : QObject(parent) {}

TabPagerDesktopSource::~TabPagerDesktopSource() = default;
