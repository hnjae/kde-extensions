// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelchange.h"

#include <utility>

namespace {
[[nodiscard]] bool
hasStableRowIdentity(const QList<TabPagerDesktopRowData> &previousRows,
                     const QList<TabPagerDesktopRowData> &nextRows) {
  if (previousRows.size() != nextRows.size()) {
    return false;
  }

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    if (previousRows.at(row).desktopId != nextRows.at(row).desktopId) {
      return false;
    }
  }

  return true;
}

[[nodiscard]] bool canExtendRowUpdate(const TabPagerDesktopRowUpdate &rowUpdate,
                                      qsizetype row, const QList<int> &roles) {
  return rowUpdate.lastRow + 1 == row && rowUpdate.roles == roles;
}

void appendRowUpdate(QList<TabPagerDesktopRowUpdate> &rowUpdates, qsizetype row,
                     QList<int> roles) {
  if (roles.isEmpty()) {
    return;
  }

  if (!rowUpdates.isEmpty() &&
      canExtendRowUpdate(rowUpdates.last(), row, roles)) {
    rowUpdates.last().lastRow = row;
    return;
  }

  rowUpdates.append(TabPagerDesktopRowUpdate{
      .firstRow = row,
      .lastRow = row,
      .roles = std::move(roles),
  });
}

[[nodiscard]] QList<TabPagerDesktopRowUpdate>
rowUpdatesForChangedRoles(const QList<TabPagerDesktopRowData> &previousRows,
                          const QList<TabPagerDesktopRowData> &nextRows) {
  QList<TabPagerDesktopRowUpdate> rowUpdates;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = previousRows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.at(row);
    QList<int> roles = tabPagerDesktopRowChangedRoles(previousRow, nextRow);
    appendRowUpdate(rowUpdates, row, std::move(roles));
  }

  return rowUpdates;
}
} // namespace

TabPagerDesktopModelChange TabPagerDesktopModelChange::unchanged() {
  return {};
}

TabPagerDesktopModelChange
TabPagerDesktopModelChange::reset(bool countChanged, bool currentIndexChanged) {
  return TabPagerDesktopModelChange{
      .type = TabPagerDesktopModelChange::Type::Reset,
      .countChanged = countChanged,
      .currentIndexChanged = currentIndexChanged,
      .rows = {},
  };
}

TabPagerDesktopModelChange
TabPagerDesktopModelChange::rowsChanged(bool currentIndexChanged,
                                        QList<TabPagerDesktopRowUpdate> rows) {
  return TabPagerDesktopModelChange{
      .type = TabPagerDesktopModelChange::Type::RowsChanged,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rows = std::move(rows),
  };
}

TabPagerDesktopModelChange tabPagerDesktopModelChangeForRows(
    const QList<TabPagerDesktopRowData> &previousRows, int previousCurrentIndex,
    const QList<TabPagerDesktopRowData> &nextRows, int nextCurrentIndex) {
  const bool countChanged = previousRows.size() != nextRows.size();
  const bool currentIndexChanged = previousCurrentIndex != nextCurrentIndex;

  if (!hasStableRowIdentity(previousRows, nextRows)) {
    return TabPagerDesktopModelChange::reset(countChanged, currentIndexChanged);
  }

  QList<TabPagerDesktopRowUpdate> rowUpdates =
      rowUpdatesForChangedRoles(previousRows, nextRows);
  if (!currentIndexChanged && rowUpdates.isEmpty()) {
    return TabPagerDesktopModelChange::unchanged();
  }

  return TabPagerDesktopModelChange::rowsChanged(currentIndexChanged,
                                                 std::move(rowUpdates));
}
