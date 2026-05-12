// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <QList>
#include <QString>
#include <QVariant>

#include <cstdint>

struct TabPagerDesktopSnapshot {
  QList<TabPagerDesktop> desktops;
  QVariant currentDesktop;
};

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
  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] bool hasDesktopAt(int index) const;
  [[nodiscard]] QVariant desktopIdAt(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;
  [[nodiscard]] TabPagerDesktopSnapshot snapshot() const;
  [[nodiscard]] TabPagerDesktopSnapshotChange
  changeForSnapshot(const TabPagerDesktopSnapshot &snapshot) const;

  void setSnapshot(const TabPagerDesktopSnapshot &snapshot);

  [[nodiscard]] static bool sameSnapshot(const TabPagerDesktopSnapshot &left,
                                         const TabPagerDesktopSnapshot &right);
  [[nodiscard]] static TabPagerDesktopRowData
  rowData(qsizetype row, const TabPagerDesktop &desktop,
          const QVariant &currentDesktop);

private:
  QList<TabPagerDesktop> m_desktops;
  QVariant m_currentDesktop;
};
