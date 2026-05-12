// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

#include <cassert>
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

bool TabPagerDesktopModelChange::isEmpty() const {
  return std::holds_alternative<std::monostate>(m_data);
}

TabPagerDesktopModelChange TabPagerDesktopModelChange::unchanged() {
  return {};
}

TabPagerDesktopModelChange
TabPagerDesktopModelChange::reset(bool countChanged, bool currentIndexChanged) {
  TabPagerDesktopModelChange change;
  change.m_data = TabPagerDesktopModelResetChange{
      .countChanged = countChanged,
      .currentIndexChanged = currentIndexChanged,
  };
  return change;
}

TabPagerDesktopModelChange
TabPagerDesktopModelChange::rowsChanged(bool currentIndexChanged,
                                        QList<TabPagerDesktopRowUpdate> rows) {
  TabPagerDesktopModelChange change;
  change.m_data = TabPagerDesktopModelRowsChange{
      .currentIndexChanged = currentIndexChanged,
      .rows = std::move(rows),
  };
  return change;
}

TabPagerDesktopModelChange::ModelUpdate
TabPagerDesktopModelChange::modelUpdate() const {
  if (std::holds_alternative<TabPagerDesktopModelResetChange>(m_data)) {
    return ModelUpdate::Reset;
  }

  if (std::holds_alternative<TabPagerDesktopModelRowsChange>(m_data)) {
    return ModelUpdate::RowsChanged;
  }

  return ModelUpdate::None;
}

const TabPagerDesktopModelResetChange &
TabPagerDesktopModelChange::resetChange() const {
  assert(std::holds_alternative<TabPagerDesktopModelResetChange>(m_data));
  return std::get<TabPagerDesktopModelResetChange>(m_data);
}

const TabPagerDesktopModelRowsChange &
TabPagerDesktopModelChange::rowsChange() const {
  assert(std::holds_alternative<TabPagerDesktopModelRowsChange>(m_data));
  return std::get<TabPagerDesktopModelRowsChange>(m_data);
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

TabPagerDesktopModelChange TabPagerDesktopModelState::changeForState(
    const TabPagerDesktopModelState &nextState) const {
  const int previousCount = count();
  const int nextCount = nextState.count();
  const bool countChanged = previousCount != nextCount;
  const bool currentIndexChanged = m_currentIndex != nextState.m_currentIndex;
  std::optional<QList<TabPagerDesktopRowUpdate>> rowUpdates =
      rowUpdatesForStableIdentity(m_rows, nextState.m_rows);

  if (rowUpdates.has_value() && !currentIndexChanged && rowUpdates->isEmpty()) {
    return TabPagerDesktopModelChange::unchanged();
  }

  if (!rowUpdates.has_value()) {
    return TabPagerDesktopModelChange::reset(countChanged, currentIndexChanged);
  }

  return TabPagerDesktopModelChange::rowsChanged(currentIndexChanged,
                                                 std::move(*rowUpdates));
}
