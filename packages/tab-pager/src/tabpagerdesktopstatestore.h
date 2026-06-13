// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"

#include <optional>

class TabPagerDesktopStateStore {
public:
  virtual ~TabPagerDesktopStateStore() = default;

  [[nodiscard]] virtual int count() const = 0;
  [[nodiscard]] virtual int currentIndex() const = 0;
  [[nodiscard]] virtual std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const = 0;

  virtual void setDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot) = 0;
};
