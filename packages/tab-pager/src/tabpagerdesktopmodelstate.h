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

class TabPagerDesktopSnapshotChange final {
public:
  [[nodiscard]] static TabPagerDesktopSnapshotChange unchanged();
  [[nodiscard]] static TabPagerDesktopSnapshotChange
  reset(bool countChanged, bool currentIndexChanged);
  [[nodiscard]] static TabPagerDesktopSnapshotChange
  updateRows(bool currentIndexChanged, QList<TabPagerDesktopRowChange> rows);

  [[nodiscard]] bool isEmpty() const;
  [[nodiscard]] bool requiresModelReset() const;
  [[nodiscard]] bool updatesRows() const;
  [[nodiscard]] bool countChanged() const;
  [[nodiscard]] bool currentIndexChanged() const;
  [[nodiscard]] const QList<TabPagerDesktopRowChange> &rowChanges() const;

private:
  enum class Operation : std::uint8_t {
    None,
    Reset,
    UpdateRows,
  };

  Operation m_operation = Operation::None;
  bool m_countChanged = false;
  bool m_currentIndexChanged = false;
  QList<TabPagerDesktopRowChange> m_rowChanges;
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
