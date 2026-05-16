// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktoprow.h"

#include <QList>

#include <cstdint>

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

[[nodiscard]] TabPagerDesktopModelChange tabPagerDesktopModelChangeForRows(
    const QList<TabPagerDesktopRowData> &previousRows, int previousCurrentIndex,
    const QList<TabPagerDesktopRowData> &nextRows, int nextCurrentIndex);
