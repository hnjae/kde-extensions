// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <QList>
#include <QString>
#include <QVariant>

#include <cstdint>

struct TabPagerDesktopRowData {
  QVariant desktopId;
  QString name;
  QString label;
  int number = 0;
  bool active = false;
};

struct TabPagerDesktopRowChange {
  qsizetype row = -1;
  TabPagerDesktopRowData previousRow;
  TabPagerDesktopRowData nextRow;
};

struct TabPagerDesktopSnapshotChange {
  enum class Operation : std::uint8_t {
    None,
    Reset,
    UpdateRows,
  };

  Operation operation = Operation::None;
  bool countChanged = false;
  bool currentIndexChanged = false;
  QList<TabPagerDesktopRowChange> rowChanges;
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
  [[nodiscard]] TabPagerDesktopSnapshot snapshot() const;
  [[nodiscard]] TabPagerDesktopSnapshotChange
  changeForState(const TabPagerDesktopModelState &nextState) const;

private:
  TabPagerDesktopSnapshot m_snapshot;
  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
};
