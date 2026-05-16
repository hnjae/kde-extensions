// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"
#include "tabpagerdesktoprow.h"

#include <QList>

#include <optional>

struct TabPagerDesktopRowsChange {
  qsizetype firstRow = -1;
  qsizetype lastRow = -1;
  QList<int> roles;
};

class TabPagerDesktopRows final {
public:
  [[nodiscard]] static TabPagerDesktopRows
  fromSnapshot(const TabPagerDesktopSnapshot &snapshot);

  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const;
  [[nodiscard]] TabPagerDesktopRowData rowData(qsizetype row) const;

  [[nodiscard]] bool hasSameIdentityAs(const TabPagerDesktopRows &other) const;
  [[nodiscard]] QList<TabPagerDesktopRowsChange>
  changesTo(const TabPagerDesktopRows &nextRows) const;

private:
  QList<TabPagerDesktopRowData> m_rows;
  int m_currentIndex = -1;
};
