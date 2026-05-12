// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktoprow.h"
#include "tabpagerdesktopsource.h"

#include <QList>
#include <QVariant>

#include <cstdint>

struct TabPagerDesktopRowUpdate {
  qsizetype row = -1;
  QList<int> roles;
};

struct TabPagerDesktopModelChange {
  enum class Type : std::uint8_t {
    Unchanged,
    Reset,
    RowsChanged,
  };

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
  [[nodiscard]] bool hasDesktopAt(int index) const;
  [[nodiscard]] QVariant desktopIdAt(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;
  [[nodiscard]] TabPagerDesktopModelChange
  changeForState(const TabPagerDesktopModelState &nextState) const;

private:
  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
};
