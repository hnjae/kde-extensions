// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

#include <optional>
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

[[nodiscard]] std::optional<QList<TabPagerDesktopRowUpdate>>
rowUpdatesForStableIdentity(const QList<TabPagerDesktopRowData> &previousRows,
                            const QList<TabPagerDesktopRowData> &nextRows) {
  if (previousRows.size() != nextRows.size()) {
    return std::nullopt;
  }

  QList<TabPagerDesktopRowUpdate> rowUpdates;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = previousRows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.at(row);
    if (previousRow.desktopId != nextRow.desktopId) {
      return std::nullopt;
    }

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

TabPagerDesktopSnapshotChange TabPagerDesktopSnapshotChange::unchanged() {
  return {};
}

TabPagerDesktopSnapshotChange
TabPagerDesktopSnapshotChange::reset(bool countChanged,
                                     bool currentIndexChanged) {
  TabPagerDesktopSnapshotChange change;
  change.m_operation = Operation::Reset;
  change.m_countChanged = countChanged;
  change.m_currentIndexChanged = currentIndexChanged;
  return change;
}

TabPagerDesktopSnapshotChange TabPagerDesktopSnapshotChange::updateRows(
    bool currentIndexChanged, QList<TabPagerDesktopRowUpdate> rows) {
  TabPagerDesktopSnapshotChange change;
  change.m_operation = Operation::UpdateRows;
  change.m_currentIndexChanged = currentIndexChanged;
  change.m_rowUpdates = std::move(rows);
  return change;
}

bool TabPagerDesktopSnapshotChange::isEmpty() const {
  return m_operation == Operation::None;
}

bool TabPagerDesktopSnapshotChange::requiresModelReset() const {
  return m_operation == Operation::Reset;
}

bool TabPagerDesktopSnapshotChange::updatesRows() const {
  return m_operation == Operation::UpdateRows;
}

bool TabPagerDesktopSnapshotChange::countChanged() const {
  return m_countChanged;
}

bool TabPagerDesktopSnapshotChange::currentIndexChanged() const {
  return m_currentIndexChanged;
}

const QList<TabPagerDesktopRowUpdate> &
TabPagerDesktopSnapshotChange::rowUpdates() const {
  return m_rowUpdates;
}

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

TabPagerDesktopSnapshotChange TabPagerDesktopModelState::changeForState(
    const TabPagerDesktopModelState &nextState) const {
  const int previousCount = count();
  const int nextCount = nextState.count();
  const bool countChanged = previousCount != nextCount;
  const bool currentIndexChanged = m_currentIndex != nextState.m_currentIndex;
  const std::optional<QList<TabPagerDesktopRowUpdate>> rowUpdates =
      rowUpdatesForStableIdentity(m_rows, nextState.m_rows);

  if (rowUpdates.has_value() && !currentIndexChanged && rowUpdates->isEmpty()) {
    return TabPagerDesktopSnapshotChange::unchanged();
  }

  if (!rowUpdates.has_value()) {
    return TabPagerDesktopSnapshotChange::reset(countChanged,
                                                currentIndexChanged);
  }

  return TabPagerDesktopSnapshotChange::updateRows(currentIndexChanged,
                                                   *rowUpdates);
}
