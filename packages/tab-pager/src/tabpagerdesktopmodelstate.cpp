// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

#include <utility>

namespace {
[[nodiscard]] TabPagerDesktopRowData
rowDataForDesktop(qsizetype row, const TabPagerDesktop &desktop,
                  const QVariant &currentDesktop) {
  const int number = static_cast<int>(row + 1);
  return TabPagerDesktopRowData{
      .desktopId = desktop.id,
      .name = desktop.name,
      .label = TabPagerDesktopLogic::labelForDesktop(number, desktop.name),
      .number = number,
      .active = desktop.id == currentDesktop,
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

[[nodiscard]] QList<TabPagerDesktopRowUpdate>
rowUpdatesForChangedRoles(const QList<TabPagerDesktopRowData> &previousRows,
                          const QList<TabPagerDesktopRowData> &nextRows) {
  QList<TabPagerDesktopRowUpdate> rowUpdates;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = previousRows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.at(row);
    QList<int> roles = tabPagerDesktopRowChangedRoles(previousRow, nextRow);
    if (!roles.isEmpty()) {
      rowUpdates.append(TabPagerDesktopRowUpdate{
          .row = row,
          .roles = std::move(roles),
      });
    }
  }

  return rowUpdates;
}
} // namespace

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState state;
  state.m_rows.reserve(snapshot.desktops.size());

  for (qsizetype row = 0; row < snapshot.desktops.size(); ++row) {
    const TabPagerDesktopRowData rowData = rowDataForDesktop(
        row, snapshot.desktops.at(row), snapshot.currentDesktop);
    if (rowData.active && state.m_currentIndex < 0) {
      state.m_currentIndex = static_cast<int>(row);
    }

    state.m_rows.append(rowData);
  }

  return state;
}

int TabPagerDesktopModelState::count() const {
  return static_cast<int>(m_rows.size());
}

int TabPagerDesktopModelState::currentIndex() const { return m_currentIndex; }

bool TabPagerDesktopModelState::hasDesktopAt(int index) const {
  return index >= 0 && index < m_rows.size();
}

QVariant TabPagerDesktopModelState::desktopIdAt(int index) const {
  return m_rows.at(index).desktopId;
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
    return TabPagerDesktopModelChange{
        .type = TabPagerDesktopModelChange::Type::Reset,
        .countChanged = countChanged,
        .currentIndexChanged = currentIndexChanged,
        .rows = {},
    };
  }

  QList<TabPagerDesktopRowUpdate> rowUpdates =
      rowUpdatesForChangedRoles(m_rows, nextState.m_rows);
  if (!currentIndexChanged && rowUpdates.isEmpty()) {
    return {};
  }

  return TabPagerDesktopModelChange{
      .type = TabPagerDesktopModelChange::Type::RowsChanged,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rows = std::move(rowUpdates),
  };
}
