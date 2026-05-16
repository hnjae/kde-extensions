// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"
#include "tabpagerdesktoprows.h"

#include <QList>

#include <cstdint>
#include <optional>

struct TabPagerDesktopModelTransition;

class TabPagerDesktopModelState final {
public:
  [[nodiscard]] static TabPagerDesktopModelState
  fromSnapshot(const TabPagerDesktopSnapshot &snapshot);

  [[nodiscard]] TabPagerDesktopModelTransition
  transitionToSnapshot(const TabPagerDesktopSnapshot &snapshot) const;
  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;

private:
  [[nodiscard]] TabPagerDesktopModelTransition
  transitionTo(TabPagerDesktopModelState nextState) const;

  TabPagerDesktopRows m_rows;
};

struct TabPagerDesktopModelTransition {
  enum class Type : std::uint8_t {
    Unchanged,
    Reset,
    RowsChanged,
  };

  TabPagerDesktopModelState nextState;
  Type type = Type::Unchanged;
  bool countChanged = false;
  bool currentIndexChanged = false;
  QList<TabPagerDesktopRowsChange> rowChanges;
};
