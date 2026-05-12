// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

namespace {
struct ResolvedSnapshot {
  TabPagerDesktopSnapshot snapshot;
  QList<TabPagerDesktopRowData> rows;
  int currentIndex = -1;
};

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

[[nodiscard]] ResolvedSnapshot
resolveSnapshot(const TabPagerDesktopSnapshot &snapshot) {
  ResolvedSnapshot resolved{
      .snapshot = snapshot,
      .rows = {},
      .currentIndex = -1,
  };
  resolved.rows.reserve(snapshot.desktops.size());

  for (qsizetype row = 0; row < snapshot.desktops.size(); ++row) {
    const TabPagerDesktopRowData rowData = rowDataForDesktop(
        row, snapshot.desktops.at(row), snapshot.currentDesktop);
    if (rowData.active && resolved.currentIndex < 0) {
      resolved.currentIndex = static_cast<int>(row);
    }

    resolved.rows.append(rowData);
  }

  return resolved;
}

[[nodiscard]] QList<TabPagerDesktopRowChange>
changedRowsForSnapshots(const QList<TabPagerDesktopRowData> &previousRows,
                        const QList<TabPagerDesktopRowData> &nextRows) {
  QList<TabPagerDesktopRowChange> rowChanges;

  for (qsizetype row = 0; row < nextRows.size(); ++row) {
    const TabPagerDesktopRowData previousRow = previousRows.at(row);
    const TabPagerDesktopRowData nextRow = nextRows.at(row);

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

TabPagerDesktopSnapshotChange TabPagerDesktopModelState::changeForSnapshot(
    const TabPagerDesktopSnapshot &nextSnapshot) const {
  if (sameSnapshot(m_snapshot, nextSnapshot)) {
    return {};
  }

  const int previousCount = count();
  const int nextCount = static_cast<int>(nextSnapshot.desktops.size());
  const bool countChanged = previousCount != nextCount;
  const ResolvedSnapshot resolvedNextSnapshot = resolveSnapshot(nextSnapshot);
  const bool currentIndexChanged =
      m_currentIndex != resolvedNextSnapshot.currentIndex;

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
      .rowChanges = changedRowsForSnapshots(m_rows, resolvedNextSnapshot.rows),
  };
}

void TabPagerDesktopModelState::setSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  const ResolvedSnapshot resolvedSnapshot = resolveSnapshot(snapshot);
  m_snapshot = resolvedSnapshot.snapshot;
  m_rows = resolvedSnapshot.rows;
  m_currentIndex = resolvedSnapshot.currentIndex;
}
