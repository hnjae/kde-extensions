// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

#include <utility>

namespace {
[[nodiscard]] bool operator==(const TabPagerDesktopRowData &left,
                              const TabPagerDesktopRowData &right) {
  return left.desktopId == right.desktopId && left.name == right.name &&
         left.label == right.label && left.number == right.number &&
         left.active == right.active;
}

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

[[nodiscard]] QList<TabPagerDesktopRowChange>
changedRowsForStates(const QList<TabPagerDesktopRowData> &previousRows,
                     const QList<TabPagerDesktopRowData> &nextRows) {
  QList<TabPagerDesktopRowChange> rowChanges;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData &previousRow = previousRows.at(row);
    const TabPagerDesktopRowData &nextRow = nextRows.at(row);

    if (previousRow != nextRow) {
      rowChanges.append(TabPagerDesktopRowChange{
          .row = row,
          .previousRow = previousRow,
          .nextRow = nextRow,
      });
    }
  }

  return rowChanges;
}

[[nodiscard]] bool
hasSameRowIdentity(const QList<TabPagerDesktopRowData> &previousRows,
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
    bool currentIndexChanged, QList<TabPagerDesktopRowChange> rows) {
  TabPagerDesktopSnapshotChange change;
  change.m_operation = Operation::UpdateRows;
  change.m_currentIndexChanged = currentIndexChanged;
  change.m_rowChanges = std::move(rows);
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

const QList<TabPagerDesktopRowChange> &
TabPagerDesktopSnapshotChange::rowChanges() const {
  return m_rowChanges;
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
  const bool rowIdentityChanged = !hasSameRowIdentity(m_rows, nextState.m_rows);
  const QList<TabPagerDesktopRowChange> rowChanges =
      rowIdentityChanged ? QList<TabPagerDesktopRowChange>{}
                         : changedRowsForStates(m_rows, nextState.m_rows);

  if (!rowIdentityChanged && !currentIndexChanged && rowChanges.isEmpty()) {
    return TabPagerDesktopSnapshotChange::unchanged();
  }

  if (rowIdentityChanged) {
    return TabPagerDesktopSnapshotChange::reset(countChanged,
                                                currentIndexChanged);
  }

  return TabPagerDesktopSnapshotChange::updateRows(currentIndexChanged,
                                                   rowChanges);
}
