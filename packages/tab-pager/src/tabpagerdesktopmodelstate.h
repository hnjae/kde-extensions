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

class TabPagerDesktopModelChange final {
public:
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

  [[nodiscard]] Type type() const;
  [[nodiscard]] bool countChanged() const;
  [[nodiscard]] bool currentIndexChanged() const;
  [[nodiscard]] const QList<TabPagerDesktopRowUpdate> &rows() const;

private:
  TabPagerDesktopModelChange() = default;

  Type m_type = Type::Unchanged;
  bool m_countChanged = false;
  bool m_currentIndexChanged = false;
  QList<TabPagerDesktopRowUpdate> m_rows;
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
