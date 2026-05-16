// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

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

[[nodiscard]] bool
canExtendRowUpdate(const TabPagerDesktopModelRowUpdate &rowUpdate,
                   qsizetype row, const QList<int> &roles) {
  return rowUpdate.lastRow + 1 == row && rowUpdate.roles == roles;
}

void appendRowUpdate(QList<TabPagerDesktopModelRowUpdate> &rowUpdates,
                     qsizetype row, QList<int> roles) {
  if (roles.isEmpty()) {
    return;
  }

  if (!rowUpdates.isEmpty() &&
      canExtendRowUpdate(rowUpdates.last(), row, roles)) {
    rowUpdates.last().lastRow = row;
    return;
  }

  rowUpdates.append(TabPagerDesktopModelRowUpdate{
      .firstRow = row,
      .lastRow = row,
      .roles = std::move(roles),
  });
}

[[nodiscard]] QList<TabPagerDesktopModelRowUpdate>
rowUpdatesForChangedRoles(const QList<TabPagerDesktopRowData> &previousRows,
                          const QList<TabPagerDesktopRowData> &nextRows) {
  QList<TabPagerDesktopModelRowUpdate> rowUpdates;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = previousRows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.at(row);
    QList<int> roles = tabPagerDesktopRowChangedRoles(previousRow, nextRow);
    appendRowUpdate(rowUpdates, row, std::move(roles));
  }

  return rowUpdates;
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
  rows.reserve(snapshot.desktops.size());

  for (qsizetype sourceRow = 0; sourceRow < snapshot.desktops.size();
       ++sourceRow) {
    const TabPagerDesktop &desktop = snapshot.desktops.at(sourceRow);
    if (!desktop.id.isValid()) {
      continue;
    }

    rows.append(rowDataForDesktop(sourceRow, desktop, snapshot.currentDesktop));
  }

  return rows;
}
} // namespace

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  return fromRows(rowsForSnapshot(snapshot));
}

TabPagerDesktopModelTransition TabPagerDesktopModelState::transitionToSnapshot(
    const TabPagerDesktopSnapshot &snapshot) const {
  return transitionTo(fromSnapshot(snapshot));
}

TabPagerDesktopModelState
TabPagerDesktopModelState::fromRows(QList<TabPagerDesktopRowData> rows) {
  TabPagerDesktopModelState state;
  state.m_currentIndex = currentIndexForRows(rows);
  state.m_rows = std::move(rows);
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

TabPagerDesktopModelTransition TabPagerDesktopModelState::transitionTo(
    TabPagerDesktopModelState nextState) const {
  const bool countChanged = m_rows.size() != nextState.m_rows.size();
  const bool currentIndexChanged = m_currentIndex != nextState.m_currentIndex;

  if (!hasStableRowIdentity(m_rows, nextState.m_rows)) {
    return TabPagerDesktopModelTransition{
        .nextState = std::move(nextState),
        .type = TabPagerDesktopModelTransition::Type::Reset,
        .countChanged = countChanged,
        .currentIndexChanged = currentIndexChanged,
        .rows = {},
    };
  }

  QList<TabPagerDesktopModelRowUpdate> rowUpdates =
      rowUpdatesForChangedRoles(m_rows, nextState.m_rows);
  if (!currentIndexChanged && rowUpdates.isEmpty()) {
    return TabPagerDesktopModelTransition{
        .nextState = std::move(nextState),
        .type = TabPagerDesktopModelTransition::Type::Unchanged,
        .countChanged = false,
        .currentIndexChanged = false,
        .rows = {},
    };
  }

  return TabPagerDesktopModelTransition{
      .nextState = std::move(nextState),
      .type = TabPagerDesktopModelTransition::Type::RowsChanged,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rows = std::move(rowUpdates),
  };
}
