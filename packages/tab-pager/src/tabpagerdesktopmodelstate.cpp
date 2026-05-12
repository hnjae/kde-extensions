// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

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

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState state;
  state.m_rows.reserve(snapshot.desktops.size());

  for (qsizetype sourceRow = 0; sourceRow < snapshot.desktops.size();
       ++sourceRow) {
    const TabPagerDesktop &desktop = snapshot.desktops.at(sourceRow);
    if (!desktop.id.isValid()) {
      continue;
    }

    const TabPagerDesktopRowData rowData =
        rowDataForDesktop(sourceRow, desktop, snapshot.currentDesktop);
    if (rowData.active && state.m_currentIndex < 0) {
      state.m_currentIndex = static_cast<int>(state.m_rows.size());
    }

    state.m_rows.append(rowData);
  }

  return state;
}

int TabPagerDesktopModelState::count() const {
  return static_cast<int>(m_rows.size());
}

int TabPagerDesktopModelState::currentIndex() const { return m_currentIndex; }

std::optional<TabPagerDesktopId>
TabPagerDesktopModelState::desktopIdForIndex(int index) const {
  if (index < 0 || index >= m_rows.size()) {
    return std::nullopt;
  }

  const TabPagerDesktopId &desktopId = m_rows.at(index).desktopId;
  return desktopId;
}

TabPagerDesktopRowData TabPagerDesktopModelState::rowData(qsizetype row) const {
  return m_rows.at(row);
}

TabPagerDesktopModelChange TabPagerDesktopModelState::changeForState(
    const TabPagerDesktopModelState &nextState) const {
  const int previousCount = count();
  const int nextCount = nextState.count();
  const bool countChanged = previousCount != nextCount;
  const bool currentIndexChanged = m_currentIndex != nextState.m_currentIndex;

  if (!hasStableRowIdentity(m_rows, nextState.m_rows)) {
    return TabPagerDesktopModelChange::reset(countChanged, currentIndexChanged);
  }

  QList<TabPagerDesktopRowUpdate> rowUpdates =
      rowUpdatesForChangedRoles(m_rows, nextState.m_rows);
  if (!currentIndexChanged && rowUpdates.isEmpty()) {
    return TabPagerDesktopModelChange::unchanged();
  }

  return TabPagerDesktopModelChange::rowsChanged(currentIndexChanged,
                                                 std::move(rowUpdates));
}
