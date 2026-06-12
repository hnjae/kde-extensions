// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprows.h"

#include "tabpagerdesktoplogic.h"

#include <QtAssert>

#include <utility>

namespace {
[[nodiscard]] TabPagerDesktopRowData
rowDataForDesktop(qsizetype row, const TabPagerDesktop &desktop,
                  const TabPagerDesktopId &currentDesktop) {
  const int number = static_cast<int>(row + 1);
  return TabPagerDesktopRowData{
      .desktopId = desktop.id,
      .name = desktop.name,
      .label = TabPagerDesktopLogic::labelForDesktop(number, desktop.name),
      .number = number,
      .active = desktop.id.matches(currentDesktop),
  };
}

[[nodiscard]] QList<TabPagerDesktopRowData>
rowsForSnapshot(const TabPagerDesktopSnapshot &snapshot) {
  QList<TabPagerDesktopRowData> rows;
  rows.reserve(snapshot.desktops().size());

  for (qsizetype sourceRow = 0; sourceRow < snapshot.desktops().size();
       ++sourceRow) {
    const TabPagerDesktop &desktop = snapshot.desktops().at(sourceRow);
    Q_ASSERT(desktop.id.isValid());

    rows.append(
        rowDataForDesktop(sourceRow, desktop, snapshot.currentDesktop()));
  }

  return rows;
}

[[nodiscard]] int
currentIndexForRows(const QList<TabPagerDesktopRowData> &rows) {
  for (qsizetype row = 0; row < rows.size(); ++row) {
    if (rows.at(row).active) {
      return static_cast<int>(row);
    }
  }

  return -1;
}

[[nodiscard]] bool
canExtendRowsChange(const TabPagerDesktopRowsChange &rowsChange, qsizetype row,
                    const QList<int> &roles) {
  return rowsChange.lastRow + 1 == row && rowsChange.roles == roles;
}

void appendRowsChange(QList<TabPagerDesktopRowsChange> &rowChanges,
                      qsizetype row, QList<int> roles) {
  if (roles.isEmpty()) {
    return;
  }

  if (!rowChanges.isEmpty() &&
      canExtendRowsChange(rowChanges.last(), row, roles)) {
    rowChanges.last().lastRow = row;
    return;
  }

  rowChanges.append(TabPagerDesktopRowsChange{
      .firstRow = row,
      .lastRow = row,
      .roles = std::move(roles),
  });
}
} // namespace

TabPagerDesktopRows
TabPagerDesktopRows::fromSnapshot(const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopRows desktopRows;
  desktopRows.m_rows = rowsForSnapshot(snapshot);
  desktopRows.m_currentIndex = currentIndexForRows(desktopRows.m_rows);
  return desktopRows;
}

int TabPagerDesktopRows::count() const {
  return static_cast<int>(m_rows.size());
}

int TabPagerDesktopRows::currentIndex() const { return m_currentIndex; }

std::optional<TabPagerDesktopId>
TabPagerDesktopRows::desktopIdForIndex(int index) const {
  if (index < 0 || index >= m_rows.size()) {
    return std::nullopt;
  }

  const TabPagerDesktopId &desktopId = m_rows.at(index).desktopId;
  return desktopId;
}

TabPagerDesktopRowData TabPagerDesktopRows::rowData(qsizetype row) const {
  return m_rows.at(row);
}

bool TabPagerDesktopRows::hasSameIdentityAs(
    const TabPagerDesktopRows &other) const {
  if (m_rows.size() != other.m_rows.size()) {
    return false;
  }

  for (qsizetype row = 0; row < other.m_rows.size(); ++row) {
    if (m_rows.at(row).desktopId != other.m_rows.at(row).desktopId) {
      return false;
    }
  }

  return true;
}

QList<TabPagerDesktopRowsChange>
TabPagerDesktopRows::changesTo(const TabPagerDesktopRows &nextRows) const {
  Q_ASSERT(hasSameIdentityAs(nextRows));

  QList<TabPagerDesktopRowsChange> rowChanges;
  for (qsizetype row = 0; row < nextRows.m_rows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = m_rows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.m_rows.at(row);
    QList<int> roles = tabPagerDesktopRowChangedRoles(previousRow, nextRow);
    appendRowsChange(rowChanges, row, std::move(roles));
  }

  return rowChanges;
}
