// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktoprow.h"
#include "tabpagerdesktopsource.h"

#include <QList>

#include <cstdint>
#include <optional>

struct TabPagerDesktopRowUpdate {
  qsizetype firstRow = -1;
  qsizetype lastRow = -1;
  QList<int> roles;
};

struct TabPagerDesktopModelChange {
  enum class Type : std::uint8_t {
    Unchanged,
    Reset,
    RowsChanged,
  };

  [[nodiscard]] static TabPagerDesktopModelChange unchanged();
  [[nodiscard]] static TabPagerDesktopModelChange
  reset(bool countChanged, bool currentIndexChanged);
  [[nodiscard]] static TabPagerDesktopModelChange
  rowsChanged(bool currentIndexChanged, QList<TabPagerDesktopRowUpdate> rows);

  Type type = Type::Unchanged;
  bool countChanged = false;
  bool currentIndexChanged = false;
  QList<TabPagerDesktopRowUpdate> rows;
};

class TabPagerDesktopModelState final {
public:
  [[nodiscard]] static TabPagerDesktopModelState
  fromSnapshot(const TabPagerDesktopSnapshot &snapshot);

  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;
  [[nodiscard]] TabPagerDesktopModelChange
  changeForState(const TabPagerDesktopModelState &nextState) const;

private:
  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
};
