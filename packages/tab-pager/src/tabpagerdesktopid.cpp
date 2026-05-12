// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopid.h"

#include <QDebug>

#include <utility>

TabPagerDesktopId::TabPagerDesktopId(QVariant value)
    : m_value(std::move(value)) {}

TabPagerDesktopId TabPagerDesktopId::fromVariant(QVariant value) {
  return TabPagerDesktopId(std::move(value));
}

QVariant TabPagerDesktopId::toVariant() const { return m_value; }

bool TabPagerDesktopId::isValid() const { return m_value.isValid(); }

bool TabPagerDesktopId::matches(const TabPagerDesktopId &other) const {
  return isValid() && other.isValid() && m_value == other.m_value;
}

bool operator==(const TabPagerDesktopId &left, const TabPagerDesktopId &right) {
  return left.m_value == right.m_value;
}

bool operator!=(const TabPagerDesktopId &left, const TabPagerDesktopId &right) {
  return !(left == right);
}

QDebug operator<<(QDebug debug, const TabPagerDesktopId &desktopId) {
  QDebugStateSaver saver(debug);
  debug.nospace() << "TabPagerDesktopId(" << desktopId.toVariant() << ")";
  return debug;
}
