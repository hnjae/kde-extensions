// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"
#include "tabpagerdesktoprow.h"

#include <QList>

#include <cstdint>
#include <optional>

struct TabPagerDesktopModelRowUpdate {
  qsizetype firstRow = -1;
  qsizetype lastRow = -1;
  QList<int> roles;
};

struct TabPagerDesktopModelTransition;

class TabPagerDesktopModelState final {
public:
  [[nodiscard]] static TabPagerDesktopModelState
  fromSnapshot(const TabPagerDesktopSnapshot &snapshot);

  [[nodiscard]] TabPagerDesktopModelTransition
  transitionForSnapshot(const TabPagerDesktopSnapshot &snapshot) const;
  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;

private:
  [[nodiscard]] TabPagerDesktopModelTransition
  transitionTo(TabPagerDesktopModelState nextState) const;

  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
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
  QList<TabPagerDesktopModelRowUpdate> rows;
};
