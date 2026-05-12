// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktoprow.h"
#include "tabpagerdesktopsource.h"

#include <QList>
#include <QVariant>

#include <cstdint>
#include <variant>

struct TabPagerDesktopRowUpdate {
  qsizetype row = -1;
  QList<int> roles;
};

struct TabPagerDesktopModelResetChange {
  bool countChanged = false;
  bool currentIndexChanged = false;
};

struct TabPagerDesktopModelRowsChange {
  bool currentIndexChanged = false;
  QList<TabPagerDesktopRowUpdate> rows;
};

class TabPagerDesktopModelChange final {
public:
  enum class ModelUpdate : std::uint8_t {
    None,
    Reset,
    RowsChanged,
  };

  [[nodiscard]] static TabPagerDesktopModelChange unchanged();
  [[nodiscard]] static TabPagerDesktopModelChange
  reset(bool countChanged, bool currentIndexChanged);
  [[nodiscard]] static TabPagerDesktopModelChange
  rowsChanged(bool currentIndexChanged, QList<TabPagerDesktopRowUpdate> rows);

  [[nodiscard]] bool isEmpty() const;
  [[nodiscard]] ModelUpdate modelUpdate() const;
  [[nodiscard]] const TabPagerDesktopModelResetChange &resetChange() const;
  [[nodiscard]] const TabPagerDesktopModelRowsChange &rowsChange() const;

private:
  using ChangeData =
      std::variant<std::monostate, TabPagerDesktopModelResetChange,
                   TabPagerDesktopModelRowsChange>;

  TabPagerDesktopModelChange() = default;

  ChangeData m_data;
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
