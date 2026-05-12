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

class TabPagerDesktopSnapshotChange final {
public:
  [[nodiscard]] static TabPagerDesktopSnapshotChange unchanged();
  [[nodiscard]] static TabPagerDesktopSnapshotChange
  reset(bool countChanged, bool currentIndexChanged);
  [[nodiscard]] static TabPagerDesktopSnapshotChange
  updateRows(bool currentIndexChanged, QList<TabPagerDesktopRowUpdate> rows);

  [[nodiscard]] bool isEmpty() const;
  [[nodiscard]] bool requiresModelReset() const;
  [[nodiscard]] bool updatesRows() const;
  [[nodiscard]] bool countChanged() const;
  [[nodiscard]] bool currentIndexChanged() const;
  [[nodiscard]] const QList<TabPagerDesktopRowUpdate> &rowUpdates() const;

private:
  enum class Operation : std::uint8_t {
    None,
    Reset,
    UpdateRows,
  };

  Operation m_operation = Operation::None;
  bool m_countChanged = false;
  bool m_currentIndexChanged = false;
  QList<TabPagerDesktopRowUpdate> m_rowUpdates;
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
  [[nodiscard]] TabPagerDesktopSnapshotChange
  changeForState(const TabPagerDesktopModelState &nextState) const;

private:
  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
};
