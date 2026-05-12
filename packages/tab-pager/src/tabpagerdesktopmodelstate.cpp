// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

namespace {
[[nodiscard]] bool sameSnapshot(const TabPagerDesktopSnapshot &left,
                                const TabPagerDesktopSnapshot &right) {
  return left.desktops == right.desktops &&
         left.currentDesktop == right.currentDesktop;
}

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
} // namespace

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState state;
  state.m_snapshot = snapshot;
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

TabPagerDesktopSnapshot TabPagerDesktopModelState::snapshot() const {
  return m_snapshot;
}

TabPagerDesktopSnapshotChange TabPagerDesktopModelState::changeForState(
    const TabPagerDesktopModelState &nextState) const {
  if (sameSnapshot(m_snapshot, nextState.m_snapshot)) {
    return {};
  }

  const int previousCount = count();
  const int nextCount = nextState.count();
  const bool countChanged = previousCount != nextCount;
  const bool currentIndexChanged = m_currentIndex != nextState.m_currentIndex;

  if (countChanged) {
    return TabPagerDesktopSnapshotChange{
        .operation = TabPagerDesktopSnapshotChange::Operation::Reset,
        .countChanged = true,
        .currentIndexChanged = currentIndexChanged,
        .rowChanges = {},
    };
  }

  return TabPagerDesktopSnapshotChange{
      .operation = TabPagerDesktopSnapshotChange::Operation::UpdateRows,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rowChanges = changedRowsForStates(m_rows, nextState.m_rows),
  };
}
