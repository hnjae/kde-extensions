// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QVariant>

class QDebug;

class TabPagerDesktopId final {
public:
  TabPagerDesktopId() = default;

  [[nodiscard]] static TabPagerDesktopId fromVariant(QVariant value);

  [[nodiscard]] QVariant toVariant() const;
  [[nodiscard]] bool isValid() const;
  [[nodiscard]] bool matches(const TabPagerDesktopId &other) const;

  friend bool operator==(const TabPagerDesktopId &left,
                         const TabPagerDesktopId &right);
  friend bool operator!=(const TabPagerDesktopId &left,
                         const TabPagerDesktopId &right);

private:
  explicit TabPagerDesktopId(QVariant value);

  QVariant m_value;
};

QDebug operator<<(QDebug debug, const TabPagerDesktopId &desktopId);
